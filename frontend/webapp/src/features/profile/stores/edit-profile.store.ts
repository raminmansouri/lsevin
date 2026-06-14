import { create } from "zustand";

type EditProfileUiState = {
  isConfirmDialogOpen: boolean;
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
};

export const useEditProfileStore = create<EditProfileUiState>((set) => ({
  isConfirmDialogOpen: false,
  openConfirmDialog: () => set({ isConfirmDialogOpen: true }),
  closeConfirmDialog: () => set({ isConfirmDialogOpen: false }),
}));