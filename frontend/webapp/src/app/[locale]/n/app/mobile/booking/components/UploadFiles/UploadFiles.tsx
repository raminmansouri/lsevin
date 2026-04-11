import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'        // <‑‑ next‑intl
import { ChevronRight, Paperclip, Plus, Trash2, X, PlusCircle, Trash, XCircle, FileUp, PlusCircle as PlusCircleIcon, Plus as PlusIcon, Trash2 as Trash2Icon, FileUp as FileUpIcon, PlusCircle as PlusCircleIconAlt, Plus as PlusIconAlt, Trash2 as Trash2IconAlt, FileUp as FileUpIconAlt } from 'lucide-react'
import { DocumentFromServer, FileUpload } from '../types/BookingTypes'



export interface UploadFilesProps {
  /** List of documents received from the backend – unchanged shape. */
  documentsFromServer: DocumentFromServer []
}

export default function UploadFiles({ documentsFromServer }: UploadFilesProps) {
  const translate = useTranslations('UploadFiles')      // namespace for your locale file


  const t = (key: string, defaultText: string) => {
    const temp = translate(key);
    if (temp)
      return temp;
    return defaultText;
  }


  // ----------  File picker helpers ----------
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)

  const openFilePicker = (docId?: string) => {
    setCurrentDocId(docId ?? null)
    fileInputRef.current?.click()
  }

  const handleFileSelect = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !currentDocId) return
    setCurrentDocId(null)

    setFileUploads(prev => {
      const idx = prev.findIndex(u => u.docId === currentDocId)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], file }
        return updated
      }
      return [...prev, { file, docId: currentDocId }]
    })
  }

  // ----------  State for file uploads ----------
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])

  // ----------  Validation ----------
  const validateUploads = () => {
    const missing = documentsFromServer.filter(d => d.required && !fileUploads.some(u => u.docId === d.id))
    if (missing.length) {
      // you could use a form library here, but we simply set a flag
      return false
    }
    return true
  }

  // ----------  UI ----------
  return (
    <>
      {/* Generic area – unchanged layout */}
      <div
        className="mt-6 mb-2 flex w-full cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 bg-white p-4 text-gray-700 hover:bg-gray-50 hover:shadow-sm"
        onClick={() => openFilePicker()}
      >
        <PlusCircleIcon className="mr-2 h-4 w-4" />
        {t('genericUpload', 'Click or drag and drop a file')}
      </div>

      {/* Hidden file input – kept minimal so we don't lose any existing code */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Documents list – identical to your original markup */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documentsFromServer.map(doc => {
          const uploadForDoc = fileUploads.find(u => u.docId === doc.id)

          return (
            <div key={doc.id} className="flex w-full flex-col rounded border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <PlusCircleIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold">{doc.title}</h3>
              </div>

              <p className="mt-2 text-sm text-gray-500">{doc.description}</p>

              {uploadForDoc && (
                <>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="relative">
                      <FileUpIcon className="h-5 w-5 text-gray-400" />
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="mt-1 flex items-center space-x-1 text-xs text-gray-700">
                          <span>{t('fileSize', 'Size')}: {formatBytes(uploadForDoc.file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <textarea
                      className="mt-2 w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('descriptionPlaceholder', 'Optional description')}
                      value={uploadForDoc.description ?? ''}
                      onChange={e => {
                        setFileUploads(prev => {
                          const idx = prev.findIndex(u => u.docId === doc.id)
                          if (idx < 0) return prev
                          const updated = [...prev]
                          updated[idx] = { ...updated[idx], description: e.target.value }
                          return updated
                        })
                      }}
                    />
                  </div>
                </>
              )}

              {!uploadForDoc && (
                <div
                  onClick={() => openFilePicker(doc.id)}
                  className="mt-4 cursor-pointer text-xs text-blue-500 hover:underline"
                >
                  {t('uploadThis', 'Upload this')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Continue button – unchanged visual styling */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center space-x-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => {
            if (!validateUploads()) {
              console.error('Please upload all required files')
              return
            }
            console.log('All required files are present – submit now')
          }}
        >
          {t('continue', 'Continue')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  )
}

// ----------  Helper ----------
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}




// const UploadFiles=()=>{

//   const { setValue,resetField } = useFormContext();

//   return (<>
//   <div>
//             <h2 className="text-xl font-bold text-gray-900 mb-2">Medical Documentation</h2>
//             <p className="text-sm text-gray-600 mb-4">
//               Upload your medical records to help our specialists prepare the best treatment plan for you
//             </p>
//           </div>
          
//           {/* Upload Area */}
//           <div 
//             onClick={() => {
//               // In real implementation, this would trigger file picker
//               if (uploadedFiles.length === 0) {
//                 setUploadedFiles(['blood', 'history']);
//                 setValue('uploadedFiles',[])
//               }
//             }}
//             className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#083f30] hover:bg-[#083f30]/5 transition-all cursor-pointer group"
//           >
//             <div className="w-16 h-16 bg-[#083f30]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#083f30]/20 transition-colors">
//               <Upload size={28} className="text-[#083f30]" />
//             </div>
//             <h3 className="font-bold text-gray-900 mb-2">Upload Medical Documents</h3>
//             <p className="text-sm text-gray-600 mb-4">
//               PDF, JPG, PNG • Up to 10MB per file
//             </p>
//             <div className="inline-flex px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors">
//               Choose Files
//             </div>
//           </div>
          
//           {/* Required Documents Checklist */}
//           <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
//             <div className="p-4 bg-gray-50 border-b border-gray-200">
//               <h3 className="font-bold text-gray-900 flex items-center gap-2">
//                 <FileText size={18} />
//                 Document Checklist
//               </h3>
//             </div>
//             <div className="p-4 space-y-3">
//               {[
//                 { name: 'Blood Test Results', required: true, uploaded: uploadedFiles.includes('blood'), description: 'Recent CBC and chemistry panel' },
//                 { name: 'Medical History Form', required: true, uploaded: uploadedFiles.includes('history'), description: 'Complete health background' },
//                 { name: 'Previous Treatment Records', required: false, uploaded: uploadedFiles.includes('previous'), description: 'If applicable' },
//                 { name: 'Allergy Information', required: false, uploaded: uploadedFiles.includes('allergy'), description: 'Known allergies or reactions' },
//               ].map((doc, idx) => (
//                 <div 
//                   key={idx}
//                   className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
//                     doc.uploaded 
//                       ? 'bg-green-50 border-green-200' 
//                       : 'bg-gray-50 border-gray-200'
//                   }`}
//                 >
//                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
//                     doc.uploaded 
//                       ? 'bg-green-600' 
//                       : 'bg-gray-300'
//                   }`}>
//                     {doc.uploaded ? (
//                       <CheckCircle2 size={20} className="text-white" />
//                     ) : (
//                       <FileText size={20} className="text-gray-600" />
//                     )}
//                   </div>
                  
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <div className="font-semibold text-gray-900 text-sm">{doc.name}</div>
//                       {doc.required && !doc.uploaded && (
//                         <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold">
//                           REQUIRED
//                         </span>
//                       )}
//                       {doc.uploaded && (
//                         <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">
//                           UPLOADED
//                         </span>
//                       )}
//                     </div>
//                     <p className="text-xs text-gray-600">{doc.description}</p>
//                   </div>
                  
//                   {!doc.uploaded && (
//                     <button 
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setUploadedFiles([...uploadedFiles, doc.name.toLowerCase().split(' ')[0]]);
//                       }}
//                       className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#0a5a44] transition-colors"
//                     >
//                       Upload
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           {/* Upload Later Option */}
//           {uploadedFiles.length === 0 && (
//             <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
//               <div className="flex gap-3">
//                 <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <h3 className="font-bold text-amber-900 mb-1">Upload Later</h3>
//                   <p className="text-sm text-amber-800 leading-relaxed">
//                     You can skip this step and upload your medical files later through your patient portal. However, uploading now helps us prepare your treatment plan faster.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//             {/* Continue Section */}
//           <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
//                 <CheckCircle2 size={20} className="text-white" />
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-bold text-green-900 mb-1">
//                   {uploadedFiles.length > 0 
//                     ? `${uploadedFiles.length} Document${uploadedFiles.length > 1 ? 's' : ''} Uploaded`
//                     : 'Ready to Continue'
//                   }
//                 </h3>
//                 <p className="text-sm text-green-800">
//                   {uploadedFiles.length > 0 
//                     ? 'Medical files uploaded successfully'
//                     : 'You can upload documents later or continue to review your booking'
//                   }
//                 </p>
//               </div>
//             </div>
            
//             {/* Continue Button */}
//             <button
//               onClick={handleNext}
//               className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
//             >
//               {uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review'}
//               <ChevronRight size={20} />
//             </button>
//           </div>
//           </>)
// }