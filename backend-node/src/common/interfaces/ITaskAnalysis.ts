import { ISpeakerIdentification } from "./ISpeakerIdentification"
import { IOverallFeedback } from "./IOverallFeedback";
import { ICrucialMoment } from "./ICrucialMoment";

export interface ITaskAnalysis {
  speakerIdentification: ISpeakerIdentification;
  crucialMoments: ICrucialMoment[];
  overallFeedback: IOverallFeedback;
}
