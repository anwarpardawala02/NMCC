import { Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, VStack, Text, Badge, HStack, Spinner } from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SendReminderButtonProps {
  fixture: any;
  onSendComplete?: () => void;
}

export function SendReminderButton({ fixture, onSendComplete }: SendReminderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reminderResults, setReminderResults] = useState<any>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  async function handleSendReminders() {
    setLoading(true);
    setSending(true);
    setReminderResults(null);
    onOpen();

    try {
      console.log(`Sending reminders for fixture: ${fixture.id}`);

      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: {
          fixture_id: fixture.id
        },
      });

      if (error) {
        console.error('Error sending reminders:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reminders',
          status: 'error',
        });
        setSending(false);
        return;
      }

      setReminderResults(data);
      setSending(false);

      if (data.reminded_count === 0) {
        toast({
          title: 'No Reminders Needed',
          description: data.message || 'All players have already responded',
          status: 'info',
        });
      } else {
        toast({
          title: 'Reminders Sent',
          description: `${data.reminded_count} reminder${data.reminded_count > 1 ? 's' : ''} sent successfully`,
          status: 'success',
        });
      }

      if (onSendComplete) {
        onSendComplete();
      }
    } catch (error: any) {
      console.error('Failed to send reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reminders',
        status: 'error',
      });
      setSending(false);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
    setReminderResults(null);
  }

  return (
    <>
      <Button
        leftIcon={<BellIcon />}
        colorScheme="orange"
        size="sm"
        onClick={handleSendReminders}
        isLoading={loading}
        loadingText="Sending..."
      >
        Send Reminder
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {sending ? 'Sending Reminders...' : 'Reminder Results'}
          </ModalHeader>
          <ModalBody>
            {sending ? (
              <VStack spacing={4} py={4}>
                <Spinner size="xl" color="orange.500" />
                <Text>Sending reminders to players who haven't responded...</Text>
              </VStack>
            ) : reminderResults ? (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" p={3} bg="orange.50" borderRadius="md">
                  <Text fontWeight="bold">Summary</Text>
                  <HStack>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {reminderResults.reminded_count || 0} sent
                    </Badge>
                    {reminderResults.failed_count > 0 && (
                      <Badge colorScheme="red" fontSize="md" px={3} py={1}>
                        {reminderResults.failed_count} failed
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                {reminderResults.reminded_count === 0 ? (
                  <Text color="gray.600" textAlign="center" py={4}>
                    ✅ All players have already responded to this fixture!
                  </Text>
                ) : (
                  <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                    {reminderResults.results?.map((result: any, index: number) => (
                      <HStack 
                        key={index} 
                        p={2} 
                        borderWidth={1} 
                        borderRadius="md"
                        bg={result.success ? 'green.50' : 'red.50'}
                        borderColor={result.success ? 'green.200' : 'red.200'}
                      >
                        <Text flex={1} fontWeight="medium">{result.player}</Text>
                        <Text fontSize="sm" color="gray.600">{result.phone}</Text>
                        <Badge colorScheme={result.success ? 'green' : 'red'}>
                          {result.success ? '✓ Sent' : '✗ Failed'}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </VStack>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleClose} colorScheme="blue">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
