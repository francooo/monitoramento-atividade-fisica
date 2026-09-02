/**
 * Nome do cookie isolado num módulo sem dependências de servidor, para que o
 * middleware (edge runtime) possa importá-lo sem arrastar o driver do banco.
 */
export const SESSION_COOKIE = "dawn_session";
