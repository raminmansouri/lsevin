"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setposts = exports.postSlice = void 0;
var toolkit_1 = require("@reduxjs/toolkit");
{
    {
        #each;
        attributes;
    }
}
;
{
    {
        /each;
    }
}
var initialState = [];
exports.postSlice = (0, toolkit_1.createSlice)({
    name: 'post',
    initialState: initialState,
    reducers: {
        setposts: function (state, action) {
            return action.payload;
        }
    }
});
exports.setposts = exports.postSlice.actions.setposts;
exports.default = exports.postSlice.reducer;
