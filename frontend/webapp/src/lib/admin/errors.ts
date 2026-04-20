export class AdminPermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AdminPermissionError";
  }
}

export class AdminNotFoundError extends Error {
  constructor(message = "Requested table or record was not found.") {
    super(message);
    this.name = "AdminNotFoundError";
  }
}
