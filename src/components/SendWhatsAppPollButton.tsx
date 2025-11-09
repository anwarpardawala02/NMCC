import { Button, useToast, HStack, VStack, Text, Box, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from '@chakra-ui/react';
import { PhoneIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SendWhatsAppPollButtonProps {
  fixture: any;
  players: any[];
  onSendComplete?: () => void;
}

export function SendWhatsAppPollButton({ fixture, players, onSendComplete }: SendWhatsAppPollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<any[]>([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  async function handleSendToSquad() {
    setLoading(true);
    setSending(true);
    setSendResults([]);
    onOpen();

    try {
      const playersWithPhone = players.filter(p => p.phone && p.phone.trim());

      if (playersWithPhone.length === 0) {
        toast({
          title: 'No phone numbers',
          description: 'No players have phone numbers registered',
          status: 'warning',
        });
        setSending(false);
        return;
      }

      console.log(`Sending WhatsApp polls to ${playersWithPhone.length} players`);

      // Send to each player and collect results
      const results = await Promise.all(
        playersWithPhone.map(player =>
          supabase.functions.invoke('send-whatsapp-message', {
            body: {
              player_phone: player.phone,
              player_name: player.full_name,
              fixture_id: fixture.id,
              opponent: fixture.opponent,
              fixture_date: fixture.fixture_date,
              venue: fixture.venue,
            },
          })
          .then(async (response: any) => ({
            player: player.full_name,
            phone: player.phone,
            success: !response.error,
            status: response.error ? 'error' : 'success',
            data: response.data || response.error
          }))
          .catch((error: any) => ({
            player: player.full_name,
            phone: player.phone,
            success: false,
            error: error.message
          }))
        )
      );

      setSendResults(results);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: 'Polls Sent',
          description: `Sent availability poll to ${successCount} players${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
          status: successCount > 0 && failureCount === 0 ? 'success' : 'warning',
        });
      }

      if (onSendComplete) {
        onSendComplete();
      }
    } catch (error) {
      console.error('Error sending polls:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send WhatsApp polls',
        status: 'error',
      });
    } finally {
      setSending(false);
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        leftIcon={<PhoneIcon />}
        colorScheme="green"
        onClick={handleSendToSquad}
        isLoading={loading}
        size="sm"
        title="Send fixture availability poll via WhatsApp"
      >
        Send Poll via WhatsApp
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>WhatsApp Poll Results</ModalHeader>
          <ModalBody>
            {sending ? (
              <VStack spacing={4} align="center" py={8}>
                <Spinner size="lg" color="green.500" />
                <Text>Sending polls to {players.filter(p => p.phone).length} players...</Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                {sendResults.length > 0 ? (
                  <>
                    {sendResults.map((result, idx) => (
                      <Box 
                        key={idx}
                        p={3}
                        borderRadius="md"
                        bg={result.success ? 'green.50' : 'red.50'}
                        borderLeft="4px solid"
                        borderColor={result.success ? 'green.500' : 'red.500'}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" color={result.success ? 'green.800' : 'red.800'}>
                              {result.player}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {result.phone}
                            </Text>
                          </VStack>
                          <Text fontSize="sm" fontWeight="bold" color={result.success ? 'green.600' : 'red.600'}>
                            {result.success ? '✓ Sent' : '✗ Failed'}
                          </Text>
                        </HStack>
                        {!result.success && result.data?.error && (
                          <Text fontSize="xs" color="red.600" mt={1}>
                            Error: {result.data.error}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </>
                ) : (
                  <Text color="gray.500">No results yet...</Text>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose} isDisabled={sending}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
