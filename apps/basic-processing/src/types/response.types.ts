export type SuccessResponse = {
  success: true;
  message: string;
  imagePath: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
  error: string;
};

export type ServiceResponse = SuccessResponse | ErrorResponse; 