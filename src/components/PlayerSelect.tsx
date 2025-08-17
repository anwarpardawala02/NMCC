import { useState, useEffect } from 'react';
import { Box, Input, List, ListItem } from '@chakra-ui/react';
import { listPlayers } from '../lib/db';
import { useAuth } from '../hooks/useAuth';

interface PlayerSelectProps {
  value: string;
  onChange: (playerId: string) => void;
}

export function PlayerSelect({ value, onChange }: PlayerSelectProps) {
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (search.length >= 2) {
      searchPlayers();
    }
  }, [search]);

  async function searchPlayers() {
    try {
      const data = await listPlayers(!!user);
      const filtered = data.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase())
      );
      setPlayers(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search players:', error);
    }
  }

  const selectedPlayer = players.find(p => p.id === value);

  return (
    <Box position="relative">
      <Input
        value={selectedPlayer ? selectedPlayer.full_name : search}
        onChange={e => {
          setSearch(e.target.value);
          if (!e.target.value) {
            onChange('');
          }
        }}
        placeholder="Search players..."
      />

      {showDropdown && search && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          borderWidth={1}
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
          zIndex={1}
        >
          {players.map(player => (
            <ListItem
              key={player.id}
              px={4}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              onClick={() => {
                onChange(player.id);
                setSearch('');
                setShowDropdown(false);
              }}
            >
              {player.full_name}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
