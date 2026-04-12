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