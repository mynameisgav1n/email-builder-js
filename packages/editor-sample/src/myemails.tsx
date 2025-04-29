import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Link,
  Stack,
  CircularProgress,
} from '@mui/material';

interface SavedEmail {
  id: number;
  short_link: string;
  title: string;
  created_at: string;
}

export default function MyEmailsPage() {
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/list-emails.php')
      .then((res) => res.json())
      .then((data) => {
        setEmails(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load emails:', err);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        My Saved Emails
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : emails.length === 0 ? (
        <Typography>No saved emails found.</Typography>
      ) : (
        <Stack spacing={2}>
          {emails.map((email) => (
            <Card key={email.id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{email.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Saved on {new Date(email.created_at).toLocaleString()}
                </Typography>
                <Link
                  href={`/${email.short_link}`}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                >
                  View Email
                </Link>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
