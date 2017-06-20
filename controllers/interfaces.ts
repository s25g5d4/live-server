export interface IControllerModel {
  status: number;
};

export interface IControllerErrorModel extends IControllerModel {
  error: string;
  message: string;
  next?: {
    href: string;
    description: string;
  };
};

export interface IControllerSuccessModel extends IControllerModel {
  success: string;
  message: string;
  next?: {
    href: string;
    description: string;
  };
};

export interface IControllerConfirmModel extends IControllerModel {
  confirm: string;
  message: string;
  buttonYes: string;
  buttonNo?: string;
  hidden?: {
    [index: string]: string;
  };
  quit?: {
    href: string;
    description: string;
  };
};
