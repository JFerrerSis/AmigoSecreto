export class LocalApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "LocalApiError";
    this.status = status;
    this.code = code;
  }
}
