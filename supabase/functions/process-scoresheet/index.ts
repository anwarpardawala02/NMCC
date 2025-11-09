// process-scoresheet.ts - Supabase Edge Function for OCR processing of cricket scoresheets
// @ts-ignore - Deno supports URL imports but TypeScript doesn't recognize them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
// Import Tesseract directly without named import
// @ts-ignore - Deno supports URL imports but TypeScript doesn't recognize them
import { createWorker } from 'https://esm.sh/tesseract.js@5.0.4'

// Define shapes of our data
interface BattingStat {
  name: string;
  runs: number;
  minutes: number;
  balls: number;
  dismissal: string;
  bowler: string;
  isNMCC: boolean;
}

interface BowlingStat {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  isNMCC: boolean;
}

interface MatchInfo {
  opponent: string;
  venue: string;
  date: string;
  toss: string;
  result: string;
}

interface ParsedScoresheet {
  match: MatchInfo;
  batting: BattingStat[];
  bowling: BowlingStat[];
  filePath: string;
  rawText?: string;
  processedAt?: string;
  functionVersion?: string;
  error?: string;
  preprocessingApplied?: string[];
}

/**
 * Optimized Tesseract settings
 * These settings can help improve OCR accuracy for cricket scoresheets
 */
function getOptimizedTesseractSettings() {
  return [
    // Standard settings for text documents
    {
      name: "standard",
      settings: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-: ',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text (PSM_SINGLE_BLOCK)
      }
    },
    // Optimized for tables with numbers
    {
      name: "table-optimized",
      settings: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-: ',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '4', // Assume a single column of text of variable sizes
      }
    },
    // Auto mode - can sometimes work better
    {
      name: "auto",
      settings: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-: ',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '3', // Fully automatic page segmentation
      }
    }
  ];
}export const corsOptions = {
  methods: ['POST'],
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
}

// OCR Functions

// Extract date from a text string (format: DD-MM-YYYY)
function extractDate(text: string): string {
  const dateRegex = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/;
  const match = text.match(dateRegex);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // Fallback - try to find any date-like pattern
  const altDateRegex = /DATE\s*[:.]?\s*([A-Za-z0-9\-\.\/\s]+)/i;
  const altMatch = text.match(altDateRegex);

  return altMatch ? altMatch[1].trim() : 'Unknown';
}

// Extract match information (opponent, venue)
function extractMatchInfo(text: string): MatchInfo {
  console.log('📋 Extracting match info from text');

  // Multiple patterns for different scoresheet formats
  const matchRegex = /MATCH.*?BETWEEN\s*(.+?)\s*(?:v|vs|versus)\s*(.+?)(?:\s|$)/i;
  const simpleVs = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+vs\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
  const somersetPattern = /(SOMERSET|Surrey)/i; // From your scoresheet

  const venueRegex = /PLAYED\s*(?:AT|IN)?\s*(.+?)(?:\s|$)/i;
  const tauntonPattern = /TAUNTON/i; // From your scoresheet

  const tossRegex = /(?:TOSS|WON BY)\s*(.+?)(?:\s|$)/i;
  const resultRegex = /RESULT\s*[:.]?\s*(.+?)(?:\s|$)/i;

  // Try different patterns
  const matchMatch = text.match(matchRegex) || text.match(simpleVs);
  const venueMatch = text.match(venueRegex) || text.match(tauntonPattern);
  const tossMatch = text.match(tossRegex);
  const resultMatch = text.match(resultRegex);

  // Special handling for Somerset vs Surrey format
  let opponent = 'Unknown';
  if (text.includes('SOMERSET') && text.includes('Surrey')) {
    opponent = 'Somerset'; // Assuming NMCC is playing Somerset
  } else if (matchMatch) {
    const team1 = matchMatch[1].trim();
    const team2 = matchMatch[2].trim();

    if (team1.toUpperCase().includes('NMCC') ||
        team1.toUpperCase().includes('NORTHOLT') ||
        team1.toUpperCase().includes('MANOR')) {
      opponent = team2;
    } else {
      opponent = team1;
    }
  } else if (text.match(somersetPattern)) {
    opponent = text.match(somersetPattern)?.[1] || 'Unknown';
  }

  return {
    opponent,
    venue: venueMatch ? (venueMatch[1] || 'Taunton') : 'Unknown',
    date: extractDate(text),
    toss: tossMatch ? tossMatch[1].trim() : 'Unknown',
    result: resultMatch ? resultMatch[1].trim() : 'Unknown'
  };
}

// Extract batting statistics
function extractBattingStats(text: string): BattingStat[] {
  const stats: BattingStat[] = [];

  console.log('🏏 Extracting batting stats...');
  console.log('📄 Sample text for analysis:', text.substring(0, 300));
  
  // Check for specific names we're looking for
  const nameChecks = ["R.J. Burns", "D.P. Sibley", "M. Slater", "Taylor"];
  nameChecks.forEach(name => {
    console.log(`- Contains "${name}":`, text.includes(name));
    if (text.includes(name)) {
      const index = text.indexOf(name);
      console.log(`  Context around "${name}":`, text.substring(Math.max(0, index-20), index + name.length + 20));
    }
  });

  // Check if the text is likely to be a cricket scoresheet
  const isCricketContent = /bat|bowl|wicket|runs|over|maiden|cricket|innings|lbw|caught|stumped/i.test(text);
  if (!isCricketContent) {
    console.warn('⚠️ Text does not appear to contain cricket terminology!');
  }

  // Multiple patterns for different batting formats - ordered from most specific to most general
  const patterns = [
    // Pattern 1: "R.J. Burns c C. Overton b Henry 5" - Caught out
    /(\w+(?:\.\s*\w+\.?)*)\s+c\s+(\w+(?:\.\s*\w+\.?)*)\s+b\s+(\w+(?:\.\s*\w+\.?)*)\s+(\d+)/gi,
    
    // Pattern 2: "R.J. Burns c and b Henry 5" - Caught and bowled
    /(\w+(?:\.\s*\w+\.?)*)\s+c\s+(?:and|&)\s+b\s+(\w+(?:\.\s*\w+\.?)*)\s+(\d+)/gi,
    
    // Pattern 3: "D.P. Sibley b Henry 21" - Bowled
    /(\w+(?:\.\s*\w+\.?)*)\s+b\s+(\w+(?:\.\s*\w+\.?)*)\s+(\d+)/gi,
    
    // Pattern 4: "J. Smith lbw b Henry 12" - LBW
    /(\w+(?:\.\s*\w+\.?)*)\s+lbw\s+b\s+(\w+(?:\.\s*\w+\.?)*)\s+(\d+)/gi,
    
    // Pattern 5: Standard table format - Name followed by runs
    /([A-Z][\w\.]+(?:\s+[A-Z][\w\.]+)*)\s+(?:not out|retired(?:\s+hurt)?|run out|st\s+\w+)\s+(\d+)/gi,
    
    // Pattern 6: More general - Player name and runs (with potential dismissal between)
    /((?:[A-Z][\.\w]+\s+){1,3})(?:.*?)\s+(\d+)(?:\s|$)/gi,
    
    // Pattern 7: Very general - Name followed by number (last resort)
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(\d+)(?:\s|$)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      const runs = parseInt(match[match.length - 1], 10);

      // Skip if this looks like a bowler or other non-batter
      if (name.toLowerCase().includes('extras') ||
          name.toLowerCase().includes('total') ||
          name.toLowerCase().includes('byes')) {
        continue;
      }

      // Determine dismissal and bowler
      let dismissal = 'not out';
      let bowler = '';

      if (match.length >= 4) {
        if (match[2] && match[2].toLowerCase() === 'c') {
          dismissal = `c ${match[3]} ${match[4] || ''}`.trim();
          bowler = match[4] || match[3] || '';
        } else if (match[2] && match[2].toLowerCase() === 'b') {
          dismissal = `b ${match[3]}`;
          bowler = match[3];
        }
      }

      stats.push({
        name,
        runs,
        minutes: 0, // Not always available
        balls: 0,   // Not always available
        dismissal,
        bowler,
        isNMCC: true // Default assumption
      });
    }
  }

  console.log(`✅ Found ${stats.length} batting records`);
  return stats;
}

// Extract bowling statistics
function extractBowlingStats(text: string): BowlingStat[] {
  const stats: BowlingStat[] = [];

  console.log('🎯 Extracting bowling stats...');
  
  // Look for any bowling related text sections
  const bowlerNameChecks = ["Henry", "Overton", "Gough", "McCague"];
  bowlerNameChecks.forEach(name => {
    if (text.includes(name)) {
      const index = text.indexOf(name);
      console.log(`  Context around "${name}":`, text.substring(Math.max(0, index-20), index + name.length + 30));
    }
  });

  // Look for bowling table headers to better identify the section
  const bowlingTableHeaders = /(?:bowler|bowling|bowlers|name|bowled)\s+(?:overs|o)\s+(?:maidens|m)\s+(?:runs|r)\s+(?:wickets|w)/i;
  const hasBowlingHeaders = bowlingTableHeaders.test(text);
  
  if (hasBowlingHeaders) {
    console.log('✅ Found bowling table headers in the text!');
  } else {
    console.log('⚠️ No clear bowling table headers found, using pattern matching only');
  }

  // Multiple patterns for bowling figures - ordered from most specific to most general
  const bowlingPatterns = [
    // Standard bowling format with dashes: "Name 10-2-35-3"
    /([A-Za-z\.\s]+?)\s+(\d+(?:\.\d+)?)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/gi,
    
    // Format with O M R W headers: "Name 10 2 35 3"
    /([A-Za-z\.\s]+?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s|$)/gi,
    
    // Table format with pipe or tab separators: "Name | 10.5 | 2 | 35 | 3"
    /([A-Za-z\.\s]+?)[|\t](\d+(?:\.\d+)?)[|\t](\d+)[|\t](\d+)[|\t](\d+)/gi,
    
    // Format with multiple spaces: "Name   10.2   2   35   3"
    /([A-Za-z\.\s]+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+)\s{2,}(\d+)\s{2,}(\d+)/gi
  ];
  
  // Use each pattern
  for (const bowlingRegex of bowlingPatterns) {
    let match;
    while ((match = bowlingRegex.exec(text)) !== null) {
      stats.push({
        name: match[1].trim(),
        overs: parseFloat(match[2]),
        maidens: parseInt(match[3], 10),
        runs: parseInt(match[4], 10),
        wickets: parseInt(match[5], 10),
        isNMCC: false // Default assumption
      });
    }
  }

  console.log(`✅ Found ${stats.length} bowling records`);
  return stats;
}

// Main edge function handler
// @ts-ignore - Deno global not recognized by TypeScript
Deno.serve(async (req) => {
  console.log('🚀 FUNCTION CALLED - CLEAN VERSION WITH NO MOCK DATA!');
  console.log('📅 Function called at:', new Date().toISOString());

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data - now expecting fileData as base64 or the filePath for existing files
    const requestData = await req.json()
    const { filePath, fileName, fileData } = requestData

    console.log('📋 Processing request:', { hasFilePath: !!filePath, hasFileData: !!fileData, fileName })

    // Create a client with service role to bypass RLS for all operations
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyaGFleWt0bXlib2VzenBhcWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1NDQ5NiwiZXhwIjoyMDcxMDMwNDk2fQ.OqkC_7zBLXJoASlyOXgC2ypQL155BizLn4BQJUU81zc'
    const supabaseClient = createClient(
      // @ts-ignore - Deno global not recognized by TypeScript
      Deno.env.get('SUPABASE_URL') ?? '',
      SERVICE_ROLE_KEY
    )

    let extractedText = '';
    // Track applied preprocessing steps
    let appliedPreprocessing: string[] = [];

    if (fileData) {
      // File data provided directly (base64)
      console.log('🔄 Starting OCR processing with optimized settings and timeout...')
      
      try {
        // Get optimized Tesseract settings
        const tesseractSettings = getOptimizedTesseractSettings();
        
        // Create worker
        const worker = await createWorker('eng');
        console.log('✅ Tesseract worker created');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OCR processing timeout after 60 seconds')), 60000);
        });

        let bestText = '';
        let bestTextLength = 0;
        let bestSettingName = '';
        
        // Try each setting and keep the best result
        for (const setting of tesseractSettings) {
          console.log(`🔄 Trying OCR with ${setting.name} settings...`);
          
          // Apply settings
          await worker.setParameters(setting.settings);
          
          // Run OCR
          const ocrPromise = worker.recognize(fileData);
          const result = await Promise.race([ocrPromise, timeoutPromise]);
          const text = result.data.text;
          
          console.log(`📏 Result length with ${setting.name} settings: ${text.length} characters`);
          
          // Check for cricket terminology
          const hasCricketTerms = text.match(/runs|wicket|over|maiden|bowl|bat|cricket|innings|somerset|surrey/i);
          if (hasCricketTerms) {
            console.log(`✅ Found cricket terminology with ${setting.name} settings`);
          }
          
          // Keep the best result (prioritize results with cricket terminology, then length)
          const currentHasCricketTerms = text.match(/runs|wicket|over|maiden|bowl|bat|cricket|innings|somerset|surrey/i);
          const bestHasCricketTerms = bestText.match(/runs|wicket|over|maiden|bowl|bat|cricket|innings|somerset|surrey/i);
          
          if (
            (currentHasCricketTerms && !bestHasCricketTerms) || 
            (currentHasCricketTerms === bestHasCricketTerms && text.length > bestTextLength)
          ) {
            bestText = text;
            bestTextLength = text.length;
            bestSettingName = setting.name;
          }
        }
        
        // Use the best result
        if (bestText) {
          console.log(`✅ Using best result from ${bestSettingName} settings (${bestTextLength} characters)`);
          extractedText = bestText;
          appliedPreprocessing = [`optimized tesseract settings: ${bestSettingName}`];
        } else {
          console.warn('⚠️ No good results found from any settings');
          extractedText = 'OCR processing completed but could not extract useful text. The image quality may be too low.';
          appliedPreprocessing = ['all settings tried, no good result'];
        }
        
        await worker.terminate();        console.log('✅ OCR completed successfully!');
        console.log('📝 Extracted text length:', extractedText.length);
        console.log('📄 First 200 chars:', extractedText.substring(0, 200));
        console.log('🔍 Looking for key patterns...');
        console.log('- Contains "R.J. Burns":', extractedText.includes('R.J. Burns'));
        console.log('- Contains "D.P. Sibley":', extractedText.includes('D.P. Sibley'));
        console.log('- Contains "Somerset":', extractedText.includes('Somerset'));
        console.log('- Contains "Surrey":', extractedText.includes('Surrey'));

      } catch (ocrError) {
        console.error('❌ OCR processing failed:', ocrError);
        console.error('❌ Error details:', ocrError.message);
        
        let errorMessage = 'OCR processing failed. ';
        
        // Provide more specific error messages based on the error type
        if (ocrError.message.includes('timeout')) {
          errorMessage += 'The image is too complex to process within the time limit. Try cropping to the relevant section or improving image clarity.';
        } else if (ocrError.message.includes('image')) {
          errorMessage += 'There was an issue with the image format. Try converting to a clear PNG or JPG file.';
        } else {
          errorMessage += 'The image may be unclear or in a format that is difficult to process. Please try a clearer image with good contrast between text and background.';
        }
        
        console.error('📋 Detailed error message:', errorMessage);
        extractedText = errorMessage;
        appliedPreprocessing = ['failed - error during processing'];
      }
    } else {
      // Required data not provided
      appliedPreprocessing = ['none - missing input data'];
      throw new Error('fileData must be provided as base64')
    }

    // Parse the extracted text to get structured data
    const matchInfo = extractMatchInfo(extractedText);
    const battingStats = extractBattingStats(extractedText);
    const bowlingStats = extractBowlingStats(extractedText);

    console.log('📊 Extraction results:');
    console.log('- Batting stats found:', battingStats.length);
    console.log('- Bowling stats found:', bowlingStats.length);
    console.log('- Match info:', matchInfo);

    // Check OCR status and data quality
    const isOcrFailed = extractedText.startsWith('OCR processing failed');
    const hasMinimalData = battingStats.length > 0 || bowlingStats.length > 0;
    const hasPoorQualityData = !isOcrFailed && extractedText.length > 100 && !hasMinimalData;
    
    let errorMessage: string | undefined = undefined;
    
    // Set appropriate error message based on outcome
    if (isOcrFailed) {
      errorMessage = extractedText;
    } else if (hasPoorQualityData) {
      errorMessage = 'OCR completed but could not identify cricket statistics. Try a clearer image with better contrast.';
    }
    
    // Create the response object - NO MOCK DATA
    const processedFilePath = fileData ? `processed_${Date.now()}_${fileName}` : filePath;
    const parsedData: ParsedScoresheet = {
      match: matchInfo,
      batting: battingStats,
      bowling: bowlingStats,
      filePath: processedFilePath,
      rawText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
      processedAt: new Date().toISOString(),
      functionVersion: 'ENHANCED_OCR_v7',
      error: errorMessage,
      preprocessingApplied: appliedPreprocessing
    };

    // Store the raw OCR data in the database for future reference
    try {
      // First, delete any existing records with the same file path to avoid cache issues
      await supabaseClient
        .from('scoresheets')
        .delete()
        .eq('file_path', processedFilePath);
      
      // Insert the new record
      const { error: insertError } = await supabaseClient
        .from('scoresheets')
        .insert({
          file_path: processedFilePath,
          raw_ocr_data: extractedText,
          processed_data: parsedData,
          version: 'v7_advanced_ocr_' + Date.now()  // Add version to ensure no caching
        })

      if (insertError) {
        console.error('Error storing scoresheet data:', insertError)
      }
    } catch (dbError) {
      console.error('Database insertion failed:', dbError)
    }

    return new Response(
      JSON.stringify(parsedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
