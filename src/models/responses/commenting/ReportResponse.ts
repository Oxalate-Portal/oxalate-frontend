import {UpdateStatusEnum} from "../../UpdateStatusEnum";

export interface ReportResponse {
  status: UpdateStatusEnum;
  errorCode: number;
  errorMessage: String;
}