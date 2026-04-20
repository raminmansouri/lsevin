
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface post {
{{#each attributes}}
  : ;
{{/each}}
}

const initialState: post[] = [];

export const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setposts(state, action: PayloadAction<post[]>) {
      return action.payload;
    }
  }
});

export const { setposts } = postSlice.actions;
export default postSlice.reducer;
