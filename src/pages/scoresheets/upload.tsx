import { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Container,
  FormControl,
  FormLabel,
  Heading,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Progress,
  useToast,
  Input,
  Flex,
  Image,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
// Removed Layout wrapper; this page is routed inside the global Layout

type BattingStat = { name: string; runs: number; minutes: number; balls: number; dismissal: string; bowler: string; isNMCC: boolean };
type BowlingStat = { name: string; overs: number; maidens: number; runs: number; wickets: number; isNMCC: boolean };
type ParsedData = {
  match: { opponent: string; venue: string; date: string; toss: string; result: string };
  batting: BattingStat[];
  bowling: BowlingStat[];
  filePath: string;
  rawText?: string;
};

export default function ScoresheetUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  
  // Check if the user is allowed to upload scoresheets
  const canUpload = user && (user.is_admin || user.role === 'fixture_manager');
  
  // Test function call
  const testFunctionCall = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-scoresheet', {
        body: { 
          fileName: 'test.jpg',
          fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      });
      
      if (error) {
        console.error('❌ Test function error:', error);
        alert(`Test failed: ${error.message}\n\nThis might be due to OCR processing issues, but the function is working. Try uploading a real scoresheet image.`);
      } else {
        alert(`Test successful! Function returned data for the scoresheet.`);
      }
    } catch (err: any) {
      console.error('❌ Test function exception:', err);
      alert(`Test exception: ${err.message}`);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG or PDF file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Create a preview URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') setPreviewUrl(res);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF, use a placeholder
      setPreviewUrl('/pdf-icon.png');
    }
    
    setUploadedFile(file);
    setParsedData(null);
    setProcessingStatus('');
    setActiveTab(0);
  };
  
  const uploadScoresheet = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus('Converting file to base64...');
    
    try {
      // 1. Convert file to base64 directly (no storage upload needed)
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = () => reject(new Error('File reading error'));
        reader.readAsDataURL(uploadedFile);
      });
      
      setUploadProgress(50);
      setProcessingStatus('Processing scoresheet with OCR...');
      
      // 2. Call the edge function with file data directly as base64
      const { data: processData, error: processError } = await supabase.functions
        .invoke('process-scoresheet', {
          body: { 
            fileName: uploadedFile!.name,
            fileData: base64Data
          }
        });
      
      if (processError) {
        console.error('❌ Process function error:', processError);
        throw processError;
      }
      
      setUploadProgress(100);
      setProcessingStatus('Scoresheet processed successfully!');
      
      // 3. Show the parsed data
      setParsedData(processData);
      setActiveTab(1); // Switch to the data preview tab
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setErrors([...errors, `Upload error: ${error.message}`]);
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const saveToDatabase = async () => {
    if (!parsedData) return;
    
    setProcessingStatus('Saving to database...');
    setIsUploading(true);
    
    try {
      // Save the match and player statistics to the database
      const { error } = await supabase.functions
        .invoke('save-scoresheet-data', {
          body: { 
            parsedData,
            filePath: parsedData.filePath
          }
        });
      
      if (error) {
        console.error('❌ Save function error:', error);
        throw error;
      }
      
      toast({
        title: 'Scoresheet saved',
        description: 'The scoresheet data has been successfully saved to the database',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      
      // Reset the form
      setUploadedFile(null);
      setPreviewUrl('');
      setParsedData(null);
      setProcessingStatus('');
      setActiveTab(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      console.error('❌ Save error:', error);
      setErrors([...errors, `Save error: ${error.message}`]);
      toast({
        title: 'Save failed',
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl">Cricket Scoresheet Upload</Heading>
          
          {!canUpload && (
            <Alert status="warning">
              <AlertIcon />
              You must be a Fixture Manager to upload and process scoresheets.
            </Alert>
          )}
          
          <Tabs index={activeTab} onChange={setActiveTab} isLazy>
            <TabList>
              <Tab>Upload</Tab>
              <Tab isDisabled={!parsedData}>Preview Data</Tab>
              <Tab isDisabled={!parsedData}>Confirm & Save</Tab>
            </TabList>
            
            <TabPanels>
              {/* Upload Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Upload Scoresheet (PNG, JPG, PDF)</FormLabel>
                    <Input 
                      type="file" 
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileChange}
                      disabled={!canUpload || isUploading}
                      ref={fileInputRef}
                      p={1}
                    />
                  </FormControl>
                  
                  {previewUrl && (
                    <Box borderWidth={1} borderRadius="md" p={4}>
                      <Heading size="sm" mb={2}>Preview</Heading>
                      {previewUrl.startsWith('data:image') ? (
                        <Image 
                          src={previewUrl} 
                          alt="Scoresheet preview" 
                          maxH="400px" 
                          objectFit="contain"
                        />
                      ) : (
                        <Box bg="gray.100" p={4} textAlign="center">
                          <Text>PDF Document</Text>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {uploadedFile && (
                    <VStack spacing={4}>
                      <Button 
                        colorScheme="blue" 
                        onClick={uploadScoresheet}
                        isLoading={isUploading}
                        loadingText="Processing..."
                        isDisabled={!canUpload}
                      >
                        Process Scoresheet
                      </Button>
                      
                      <Button 
                        colorScheme="gray" 
                        onClick={testFunctionCall}
                        isDisabled={!canUpload}
                        size="sm"
                      >
                        Test Function Call
                      </Button>
                    </VStack>
                  )}
                  
                  {isUploading && (
                    <Box>
                      <Text mb={2}>{processingStatus}</Text>
                      <Progress value={uploadProgress} />
                    </Box>
                  )}
                  
                  {errors.length > 0 && (
                    <Alert status="error">
                      <AlertIcon />
                      <VStack align="start">
                        {errors.map((error, index) => (
                          <Text key={index}>{error}</Text>
                        ))}
                      </VStack>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Preview Data Tab */}
              <TabPanel>
                {parsedData ? (
                  <VStack spacing={8} align="stretch">
                    <Card>
                      <CardHeader>
                        <Heading size="md">Match Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                          <Box>
                            <Text fontWeight="bold">Match</Text>
                            <Text>{parsedData.match.opponent} vs NMCC</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Date</Text>
                            <Text>{parsedData.match.date}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Venue</Text>
                            <Text>{parsedData.match.venue}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Toss</Text>
                            <Text>Won by {parsedData.match.toss}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold">Result</Text>
                            <Text>{parsedData.match.result}</Text>
                          </Box>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <Heading size="md">Batting Statistics</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box overflowX="auto">
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Batsman</Th>
                                <Th isNumeric>Runs</Th>
                                <Th isNumeric>Mins</Th>
                                <Th isNumeric>Balls</Th>
                                <Th>Dismissal</Th>
                                <Th>Bowler</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {parsedData.batting.map((bat, index) => (
                                <Tr key={index}>
                                  <Td>
                                    {bat.name}
                                    {bat.isNMCC ? (
                                      <Badge ml={2} colorScheme="green">NMCC</Badge>
                                    ) : (
                                      <Badge ml={2} colorScheme="purple">Opponent</Badge>
                                    )}
                                  </Td>
                                  <Td isNumeric>{bat.runs}</Td>
                                  <Td isNumeric>{bat.minutes}</Td>
                                  <Td isNumeric>{bat.balls}</Td>
                                  <Td>{bat.dismissal}</Td>
                                  <Td>{bat.bowler}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <Heading size="md">Bowling Statistics</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box overflowX="auto">
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Bowler</Th>
                                <Th isNumeric>Overs</Th>
                                <Th isNumeric>Maidens</Th>
                                <Th isNumeric>Runs</Th>
                                <Th isNumeric>Wickets</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {parsedData.bowling.map((bowl, index) => (
                                <Tr key={index}>
                                  <Td>
                                    {bowl.name}
                                    {bowl.isNMCC ? (
                                      <Badge ml={2} colorScheme="green">NMCC</Badge>
                                    ) : (
                                      <Badge ml={2} colorScheme="purple">Opponent</Badge>
                                    )}
                                  </Td>
                                  <Td isNumeric>{bowl.overs}</Td>
                                  <Td isNumeric>{bowl.maidens}</Td>
                                  <Td isNumeric>{bowl.runs}</Td>
                                  <Td isNumeric>{bowl.wickets}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </CardBody>
                    </Card>
                    
                    <Flex justifyContent="space-between">
                      <Button onClick={() => setActiveTab(0)}>Back</Button>
                      <Button colorScheme="blue" onClick={() => setActiveTab(2)}>Next: Confirm & Save</Button>
                    </Flex>
                  </VStack>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Spinner size="xl" />
                    <Text mt={4}>Loading parsed data...</Text>
                  </Box>
                )}
              </TabPanel>
              
              {/* Confirm & Save Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Alert status="info">
                    <AlertIcon />
                    Please review the extracted data. Once confirmed, the data will be saved to the database.
                  </Alert>
                  
                  <Box borderWidth={1} borderRadius="md" p={6} bg="gray.50">
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Summary</Heading>
                      
                      <SimpleGrid columns={[1, 2]} spacing={4}>
                        <Box>
                          <Text fontWeight="bold">Match</Text>
                          <Text>{parsedData?.match.opponent} vs NMCC</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Date</Text>
                          <Text>{parsedData?.match.date}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Batting Records</Text>
                          <Text>{parsedData?.batting.length || 0}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Bowling Records</Text>
                          <Text>{parsedData?.bowling.length || 0}</Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </Box>
                  
                  <Flex justifyContent="space-between">
                    <Button onClick={() => setActiveTab(1)}>Back</Button>
                    <Button 
                      colorScheme="green" 
                      onClick={saveToDatabase}
                      isLoading={isUploading}
                      loadingText="Saving..."
                      isDisabled={!canUpload}
                    >
                      Confirm & Save to Database
                    </Button>
                  </Flex>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
  </Container>
  );
}
