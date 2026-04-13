import ServiceSelection from '../ServiceSelection/ServiceSelection';
import { SelectDate } from '../SelectDate/SelectDate';
import { SelectTime } from '../SelectTime/SelectTime';
import { AddOns } from '../AddOns/AddOns';
import UploadFiles from '../UploadFiles/UploadFiles';
import { ReviewPay } from '../ReviewPay/ReviewPay';

  export const StepDefinitions = {
    ChooseYourService: <ServiceSelection />,
    SelectDate: <SelectDate />,
    SelectTime: <SelectTime />,
    AddOns: <AddOns />,
    UploadFiles: <UploadFiles documentsFromServer={[
      { title: 'Blood Test Results', required: true, description: 'Recent CBC and chemistry panel' },
      { title: 'Medical History Form', required: true, description: 'Complete health background' },
      { title: 'Previous Treatment Records', required: false, description: 'If applicable' },
      { title: 'Allergy Information', required: false, description: 'Known allergies or reactions' },
    ]} />,
    ReviewPay: <ReviewPay />,
  }


  
export interface DocumentFromServer {
  id?: string
  title?: string
  description?: string
  icon?: string
  required?: boolean
}

export interface FileUpload {
  file: File
  description?: string
  docId: string
}


export interface BookingCheckoutResponse{

}
export interface BookingCheckoutPayload{
  
}