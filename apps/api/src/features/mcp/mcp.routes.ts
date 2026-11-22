import type { RequestHandler, Router } from 'express';
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
  requireBearerAuth,
} from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { OAuthError, OAuthErrorCode, type OAuthTokenVerifier } from '@modelcontextprotocol/server';
import { isAllowedUser } from '../../auth/middleware.ts';
import { InvalidTokenError, type TokenVerifier } from '../../auth/tokens.ts';
import { HttpError } from '../../lib/http-error.ts';
import { createMcpServer, type McpServices } from './mcp.tools.ts';

export interface McpOptions {
  verifier: TokenVerifier;
  services: McpServices;
  allowedUserIds: readonly string[];
  /** Public URL of the MCP endpoint (MCP_RESOURCE_URL). */
  resourceUrl: string;
}

/**
 * OAuth discovery documents for MCP clients, mounted at the app root:
 * `/.well-known/oauth-protected-resource/<path>` names AuthKit as the authorization server, and
 * `/.well-known/oauth-authorization-server` mirrors AuthKit's metadata for older clients.
 */
export function mcpMetadataRouter(resourceUrl: string, authkitDomain: string): Router {
  const issuer = authkitDomain.replace(/\/$/, '');
  return mcpAuthMetadataRouter({
    resourceServerUrl: new URL(resourceUrl),
    resourceName: 'App MCP server',
    oauthMetadata: {
      issuer,
      authorization_endpoint: `${issuer}/oauth2/authorize`,
      token_endpoint: `${issuer}/oauth2/token`,
      registration_endpoint: `${issuer}/oauth2/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
      scopes_supported: ['email', 'offline_access', 'openid', 'profile'],
    },
  });
}

/**
 * Handlers for POST /mcp (Streamable HTTP, stateless): bearer auth with an OAuth challenge that
 * points clients at the metadata above, the user allowlist, then one MCP server per request.
 */
export function mcpHandlers(options: McpOptions): RequestHandler[] {
  const resourceUrl = new URL(options.resourceUrl);

  const verifier: OAuthTokenVerifier = {
    async verifyAccessToken(token) {
      try {
        const verified = await options.verifier.verifyMcp(token);
        return {
          token,
          clientId: verified.clientId,
          scopes: [],
          expiresAt: verified.expiresAt,
          resource: resourceUrl,
          extra: { userId: verified.userId },
        };
      } catch (error) {
        if (error instanceof InvalidTokenError) {
          throw new OAuthError(OAuthErrorCode.InvalidToken, error.message);
        }
        throw error;
      }
    },
  };

  const authenticate = requireBearerAuth({
    verifier,
    expectedResource: resourceUrl,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resourceUrl),
  });

  const handle: RequestHandler = async (req, res) => {
    const userId = req.auth?.extra?.['userId'];
    if (typeof userId !== 'string') throw new HttpError(401, 'unauthorized', 'Sign in required');
    if (!isAllowedUser(options.allowedUserIds, userId)) {
      throw new HttpError(403, 'forbidden', 'This account does not have access');
    }

    const server = createMcpServer(options.services, userId);
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };

  return [authenticate, handle];
}
