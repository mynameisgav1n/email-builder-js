import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Snackbar, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Stack, CircularProgress, Tooltip
} from '@mui/material';
import { Delete, Edit, FileCopy, Folder, InsertDriveFile, Image } from '@mui/icons-material';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function FileManager() {
  console.log("FileManager component loaded");
  return <h1 style={{ padding: 100 }}>Hello from FileManager</h1>;
}
