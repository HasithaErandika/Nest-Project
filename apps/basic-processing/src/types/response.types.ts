export type SuccessResponse = {
  success: true;
  message: string;
  imagePath: string; // Standardized path property name
};

export type ErrorResponse = {
  success: false;
  message: string;
  error: string;
};

export type ServiceResponse = SuccessResponse | ErrorResponse; 