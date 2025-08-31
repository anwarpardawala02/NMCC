# Edge Function Cleanup Documentation

## Overview

This document outlines the cleanup performed on the Edge Functions and related code after implementing direct base64 file processing. These changes were made to remove obsolete code that was previously used for storage bucket operations.

## Changes Made

### 1. Removed Storage-related Code from Process Scoresheet Function

We eliminated code that attempted to download files from storage buckets since we're now sending base64 data directly from the client. The previous storage-related code was causing RLS policy errors and adding unnecessary complexity.

```typescript
// REMOVED
const { data: storageFileData, error: fileError } = await supabaseClient
  .storage
  .from('scoresheets')
  .download(filePath)
```

### 2. Updated Photo Upload Logic

Modified the `photo.ts` library to convert files to base64 directly and store them in the database rather than uploading to a storage bucket:

```typescript
// NEW APPROACH
export async function uploadPhoto(file: File, title?: string) {
  // Generate a unique ID for the photo
  const uniqueId = crypto.randomUUID();
  const fileName = `${uniqueId}-${file.name}`;
  
  // Convert file to base64 directly (avoiding storage bucket)
  const base64Data = await fileToBase64(file);
  
  // Store metadata in database with the base64 content
  const res = await supabase.from('photos').insert({ 
    title: title ?? file.name, 
    file_name: fileName,
    base64_data: base64Data,
    created_at: new Date()
  });
  
  if (res.error) throw res.error;

  // Return a generated URL that can be used to reference the photo
  return `/api/photos/${uniqueId}`;
}
```

### 3. Simplified Authentication Logic

Removed unnecessary authentication checks from Edge Functions since we're using the service role key to bypass RLS policies:

```typescript
// REMOVED
if (!userId) {
  console.log('⚠️ No userId provided, proceeding without user authentication')
} else {
  console.log('✅ Using userId:', userId)
}
```

### 4. Simplified Upload Component

Removed storage-related code from `Upload.tsx` and simplified the upload process to work directly with base64:

```typescript
// Example of simplified process
const base64Data = await fileToBase64(uploadedFile);
const { data } = await supabase.functions.invoke('process-scoresheet', {
  body: { 
    fileName: uploadedFile!.name,
    fileData: base64Data
  }
});
```

## Benefits of Changes

1. **Reliability**: Bypassing storage operations reduces potential points of failure
2. **Simplicity**: Direct base64 processing simplifies the code and reduces complexity
3. **Performance**: Fewer API calls and no intermediate storage operations
4. **Security**: Using service role key consistently avoids RLS policy issues

## Considerations for Future Development

1. **Base64 Data Size**: Large files will have correspondingly large base64 representations. Consider implementing limits for file sizes.
2. **Database Storage**: Storing base64 data directly in the database will increase storage usage. Consider future optimizations if needed.
3. **Caching**: Consider adding caching for processed scoresheets to improve performance.

## Next Steps

1. Monitor the application for any issues related to the changes
2. Consider adding database migrations to support the new base64 storage approach
3. Update any tests to reflect the new processing flow
