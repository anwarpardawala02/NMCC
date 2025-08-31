import { useState } from 'react';
import { Button, Input, Box, useToast } from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import { useAuth } from '../hooks/useAuth';
import { uploadPhoto } from '../lib/photo';

interface PhotoUploaderProps {
  onSuccess: (url: string) => void;
}

export function PhotoUploader({ onSuccess }: PhotoUploaderProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to upload photos',
        status: 'error',
      });
      return;
    }

    const file = e.target.files[0];
    setLoading(true);

    try {
      // Uses the improved uploadPhoto function that handles base64 conversion
      const url = await uploadPhoto(file, file.name);
      onSuccess(url);
      
      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
        status: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        display="none"
        id="photo-upload"
      />
      <label htmlFor="photo-upload">
        <Button
          as="span"
          leftIcon={<AttachmentIcon />}
          isLoading={loading}
          loadingText="Uploading..."
          cursor="pointer"
        >
          Upload Photo
        </Button>
      </label>
    </Box>
  );
}
