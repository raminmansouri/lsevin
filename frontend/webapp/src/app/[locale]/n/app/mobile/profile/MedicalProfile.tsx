"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNavigate } from '@/hooks/use-navigate';
import { 
  ArrowLeft, 
  Plus, 
  AlertCircle, 
  Pill, 
  FileText, 
  User, 
  Phone, 
  Edit2, 
  X, 
  Upload,
  Check,
  Trash2,
  Lock,
  Save
} from 'lucide-react';

type ModalType = 'allergy' | 'medication' | 'condition' | 'document' | 'emergency' | null;

export default function MedicalProfile() {
  const navigate = useNavigate();
  const t = useTranslations("MobileProfile.medicalProfileLegacy");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [allergies, setAllergies] = useState(['Penicillin', 'Shellfish']);
  const [medications, setMedications] = useState([
    'Lisinopril 10mg (Daily)', 
    'Metformin 500mg (Twice daily)'
  ]);
  const [conditions, setConditions] = useState(['Type 2 Diabetes', 'Hypertension']);
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Blood Test Results - Jan 2026', date: '2026-01-15', size: '2.4 MB' },
    { id: 2, name: 'X-Ray Report - Dec 2025', date: '2025-12-20', size: '1.8 MB' },
  ]);
  const [emergencyContact, setEmergencyContact] = useState({
    name: 'John Rodriguez',
    phone: '+971 50 987 6543',
    relationship: 'Spouse'
  });

  // Form states
  const [allergyForm, setAllergyForm] = useState({ name: '', severity: 'moderate', notes: '' });
  const [medicationForm, setMedicationForm] = useState({ name: '', dosage: '', frequency: '', notes: '' });
  const [conditionForm, setConditionForm] = useState({ name: '', diagnosedDate: '', notes: '' });
  const [documentForm, setDocumentForm] = useState({ file: null as File | null, name: '', uploadProgress: 0, uploadStatus: 'idle' as 'idle' | 'uploading' | 'success' | 'error' });
  const [emergencyForm, setEmergencyForm] = useState(emergencyContact);

  const handleAddAllergy = () => {
    if (allergyForm.name.trim()) {
      const allergyText = `${allergyForm.name}${allergyForm.severity !== 'moderate' ? ` (${allergyForm.severity})` : ''}`;
      setAllergies([...allergies, allergyText]);
      setAllergyForm({ name: '', severity: 'moderate', notes: '' });
      setActiveModal(null);
    }
  };

  const handleAddMedication = () => {
    if (medicationForm.name.trim() && medicationForm.dosage.trim()) {
      const medText = `${medicationForm.name} ${medicationForm.dosage} (${medicationForm.frequency})`;
      setMedications([...medications, medText]);
      setMedicationForm({ name: '', dosage: '', frequency: '', notes: '' });
      setActiveModal(null);
    }
  };

  const handleAddCondition = () => {
    if (conditionForm.name.trim()) {
      setConditions([...conditions, conditionForm.name]);
      setConditionForm({ name: '', diagnosedDate: '', notes: '' });
      setActiveModal(null);
    }
  };

  const handleUploadDocument = () => {
    if (!documentForm.file) return;

    setDocumentForm({ ...documentForm, uploadStatus: 'uploading', uploadProgress: 0 });

    // Simulate upload progress
    const interval = setInterval(() => {
      setDocumentForm(prev => {
        if (prev.uploadProgress >= 100) {
          clearInterval(interval);
          return { ...prev, uploadStatus: 'success', uploadProgress: 100 };
        }
        return { ...prev, uploadProgress: prev.uploadProgress + 10 };
      });
    }, 200);

    // After success, add to documents
    setTimeout(() => {
      const newDoc = {
        id: documents.length + 1,
        name: documentForm.name || documentForm.file!.name,
        date: new Date().toISOString().split('T')[0],
        size: `${(documentForm.file!.size / 1024 / 1024).toFixed(1)} MB`
      };
      setDocuments([...documents, newDoc]);
      setDocumentForm({ file: null, name: '', uploadProgress: 0, uploadStatus: 'idle' });
      setActiveModal(null);
    }, 2500);
  };

  const handleSaveEmergencyContact = () => {
    setEmergencyContact(emergencyForm);
    setActiveModal(null);
  };

  const removeItem = (type: 'allergy' | 'medication' | 'condition', index: number) => {
    if (type === 'allergy') {
      setAllergies(allergies.filter((_, i) => i !== index));
    } else if (type === 'medication') {
      setMedications(medications.filter((_, i) => i !== index));
    } else if (type === 'condition') {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-3">{t("title")}</h1>
        </div>
      </div>
      
      {/* Privacy Notice */}
      <div className="px-5 pt-6 pb-4">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-1">{t("privacyTitle")}</h3>
              <p className="text-sm text-white/90">
                {t("privacyDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 pb-8 space-y-4">
        {/* Allergies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t("sections.allergies")}</h3>
            </div>
            <button 
              onClick={() => setActiveModal('allergy')}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {allergies.length > 0 ? (
            <div className="space-y-2">
              {allergies.map((allergy, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-gray-900 font-medium">{allergy}</span>
                  <button 
                    onClick={() => removeItem('allergy', idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">{t("empty.noAllergies")}</p>
              <button 
                onClick={() => setActiveModal('allergy')}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                {t("empty.addFirstAllergy")}
              </button>
            </div>
          )}
        </div>
        
        {/* Current Medications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Pill size={20} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t("sections.currentMedications")}</h3>
            </div>
            <button 
              onClick={() => setActiveModal('medication')}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-gray-900 text-sm font-medium">{med}</span>
                  <button 
                    onClick={() => removeItem('medication', idx)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">{t("empty.noMedications")}</p>
              <button 
                onClick={() => setActiveModal('medication')}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                {t("empty.addFirstMedication")}
              </button>
            </div>
          )}
        </div>
        
        {/* Medical Conditions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t("sections.medicalHistory")}</h3>
            </div>
            <button 
              onClick={() => setActiveModal('condition')}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {conditions.length > 0 ? (
            <div className="space-y-2">
              {conditions.map((condition, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-gray-900 font-medium">{condition}</span>
                  <button 
                    onClick={() => removeItem('condition', idx)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">{t("empty.noConditions")}</p>
              <button 
                onClick={() => setActiveModal('condition')}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                Add medical history
              </button>
            </div>
          )}
        </div>
        
        {/* Medical Documents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t("sections.medicalDocuments")}</h3>
            </div>
            <button 
              onClick={() => setActiveModal('document')}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{doc.date} • {doc.size}</p>
                  </div>
                  <button className="text-[#083f30] text-sm font-semibold hover:underline ml-4">
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">{t("empty.noDocuments")}</p>
              <button 
                onClick={() => setActiveModal('document')}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                Upload your first document
              </button>
            </div>
          )}
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Phone size={20} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t("sections.emergencyContact")}</h3>
            </div>
            <button 
              onClick={() => {
                setEmergencyForm(emergencyContact);
                setActiveModal('emergency');
              }}
              className="text-[#083f30] font-semibold text-sm hover:underline"
            >
              <Edit2 size={16} className="inline-block mr-1" />
              Edit
            </button>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray-600" />
              <span className="text-gray-900 font-semibold">{emergencyContact.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Phone size={16} className="text-gray-600" />
              <span className="text-gray-700">{emergencyContact.phone}</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{emergencyContact.relationship}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Add Allergy Modal */}
            {activeModal === 'allergy' && (
              <>
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{t("modals.addAllergy")}</h2>
                    <button 
                      onClick={() => setActiveModal(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={24} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.allergyName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={allergyForm.name}
                      onChange={(e) => setAllergyForm({ ...allergyForm, name: e.target.value })}
                      placeholder={t("placeholders.allergyName")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Severity Level
                    </label>
                    <select
                      value={allergyForm.severity}
                      onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors bg-white"
                    >
                      <option value="mild">{t("severity.mild")}</option>
                      <option value="moderate">{t("severity.moderate")}</option>
                      <option value="severe">{t("severity.severe")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={allergyForm.notes}
                      onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
                      placeholder={t("placeholders.reactionNotes")}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={handleAddAllergy}
                    disabled={!allergyForm.name.trim()}
                    className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {t("modals.addAllergy")}
                  </button>
                </div>
              </>
            )}

            {/* Add Medication Modal */}
            {activeModal === 'medication' && (
              <>
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{t("modals.addMedication")}</h2>
                    <button 
                      onClick={() => setActiveModal(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={24} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.medicationName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicationForm.name}
                      onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                      placeholder={t("placeholders.medicationName")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.dosage")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                      placeholder={t("placeholders.dosage")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.frequency")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors bg-white"
                    >
                      <option value="">{t("frequency.select")}</option>
                      <option value="Once daily">{t("frequency.onceDaily")}</option>
                      <option value="Twice daily">{t("frequency.twiceDaily")}</option>
                      <option value="Three times daily">{t("frequency.threeTimesDaily")}</option>
                      <option value="As needed">{t("frequency.asNeeded")}</option>
                      <option value="Weekly">{t("frequency.weekly")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={medicationForm.notes}
                      onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                      placeholder={t("placeholders.medicationNotes")}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={handleAddMedication}
                    disabled={!medicationForm.name.trim() || !medicationForm.dosage.trim() || !medicationForm.frequency}
                    className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Medication
                  </button>
                </div>
              </>
            )}

            {/* Add Condition Modal */}
            {activeModal === 'condition' && (
              <>
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{t("modals.addCondition")}</h2>
                    <button 
                      onClick={() => setActiveModal(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={24} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.conditionName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={conditionForm.name}
                      onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                      placeholder={t("placeholders.conditionName")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Diagnosed Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={conditionForm.diagnosedDate}
                      onChange={(e) => setConditionForm({ ...conditionForm, diagnosedDate: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={conditionForm.notes}
                      onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                      placeholder={t("placeholders.conditionNotes")}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={handleAddCondition}
                    disabled={!conditionForm.name.trim()}
                    className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Condition
                  </button>
                </div>
              </>
            )}

            {/* Upload Document Modal */}
            {activeModal === 'document' && (
              <>
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{t("modals.uploadDocument")}</h2>
                    <button 
                      onClick={() => {
                        setActiveModal(null);
                        setDocumentForm({ file: null, name: '', uploadProgress: 0, uploadStatus: 'idle' });
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={24} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {documentForm.uploadStatus === 'idle' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Document Name
                        </label>
                        <input
                          type="text"
                          value={documentForm.name}
                          onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                          placeholder={t("placeholders.documentName")}
                          className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Select File <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setDocumentForm({ ...documentForm, file, name: documentForm.name || file.name.replace(/\.[^/.]+$/, '') });
                              }
                            }}
                            className="hidden"
                            id="document-upload"
                          />
                          <label
                            htmlFor="document-upload"
                            className="flex items-center justify-center gap-3 w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#083f30] hover:bg-gray-50 transition-all cursor-pointer"
                          >
                            <Upload size={24} className="text-gray-400" />
                            <div className="text-center">
                              <p className="font-semibold text-gray-900">{t("upload.clickToUpload")}</p>
                              <p className="text-sm text-gray-500 mt-1">{t("upload.formatsShort")}</p>
                            </div>
                          </label>
                        </div>
                        {documentForm.file && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm font-semibold text-green-900">{documentForm.file.name}</p>
                            <p className="text-xs text-green-700 mt-1">
                              {(documentForm.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          <strong>{t("upload.acceptedFormatsLabel")}</strong> {t("upload.acceptedFormats")}<br />
                          <strong>{t("upload.maximumSizeLabel")}</strong> {t("upload.maximumSize")}<br />
                          <strong>{t("upload.examplesLabel")}</strong> {t("upload.examples")}
                        </p>
                      </div>
                    </>
                  )}

                  {documentForm.uploadStatus === 'uploading' && (
                    <div className="py-8">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-[#083f30] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload size={28} className="text-white animate-pulse" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{t("upload.uploadingTitle")}</h3>
                        <p className="text-sm text-gray-600">{t("upload.progress", { progress: documentForm.uploadProgress })}</p>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#083f30] transition-all duration-300"
                          style={{ width: `${documentForm.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {documentForm.uploadStatus === 'success' && (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{t("upload.successTitle")}</h3>
                      <p className="text-sm text-gray-600">{t("upload.successDescription")}</p>
                    </div>
                  )}

                  {documentForm.uploadStatus === 'error' && (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={32} className="text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{t("upload.failedTitle")}</h3>
                      <p className="text-sm text-gray-600 mb-4">{t("upload.failedDescription")}</p>
                      <button
                        onClick={() => setDocumentForm({ ...documentForm, uploadStatus: 'idle', uploadProgress: 0 })}
                        className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
                      >
                        Retry Upload
                      </button>
                    </div>
                  )}
                </div>
                
                {documentForm.uploadStatus === 'idle' && (
                  <div className="p-6 border-t border-gray-200">
                    <button
                      onClick={handleUploadDocument}
                      disabled={!documentForm.file}
                      className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      {t("modals.uploadDocument")}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Edit Emergency Contact Modal */}
            {activeModal === 'emergency' && (
              <>
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{t("sections.emergencyContact")}</h2>
                    <button 
                      onClick={() => setActiveModal(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X size={24} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.fullName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emergencyForm.name}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                      placeholder={t("placeholders.fullName")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.phoneNumber")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={emergencyForm.phone}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                      placeholder={t("placeholders.phoneNumber")}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("fields.relationship")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={emergencyForm.relationship}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">{t("relationship.other")}</option>
                    </select>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveEmergencyContact}
                    disabled={!emergencyForm.name.trim() || !emergencyForm.phone.trim()}
                    className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {t("buttons.saveContact")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
