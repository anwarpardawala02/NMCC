import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, HStack, VStack,
  Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input,
  Textarea, Select, useToast, Spinner, Tfoot, Tooltip, IconButton
} from '@chakra-ui/react';
import { EditIcon, CheckIcon } from '@chakra-ui/icons';
import { listPlayers, listFixtures, listClubFees, upsertClubFee, getFixtureAvailability } from '../lib/db';
import type { Player, Fixture, ClubFee } from '../lib/db';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function AdminFeesMatrix() {
  // Inline amount state for squad and match fees
  const [inlineSquadAmounts, setInlineSquadAmounts] = useState<Record<string, string>>({});
  const [inlineMatchAmounts, setInlineMatchAmounts] = useState<Record<string, Record<string, string>>>({});
  const [savingSquad, setSavingSquad] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [savingMatch, setSavingMatch] = useState<Record<string, Record<string, 'idle' | 'saving' | 'saved'>>>({});
  // All hooks must be called unconditionally and in the same order
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fees, setFees] = useState<ClubFee[]>([]);
  const [availabilityByFixture, setAvailabilityByFixture] = useState<Record<string, Record<string, 'Available' | 'Not Available'>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const tableRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editCell, setEditCell] = useState<{ player: Player; fixture: Fixture | null } | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [paidOn, setPaidOn] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [category, setCategory] = useState<'Match Fee' | 'Squad Fee' | 'Nets' | 'Chai' | 'Other'>('Match Fee');

  // Always call hooks before any early return
  useEffect(() => {
    // Initialize inline amounts when data loads
    const squad: Record<string, string> = {};
    const match: Record<string, Record<string, string>> = {};
    for (const p of players) {
      const cf = getFee(p.id, null, 'Squad Fee');
      squad[p.id] = cf ? cf.amount.toString() : '';
      match[p.id] = {};
      for (const f of fixtures) {
        const mf = getFee(p.id, f.id, 'Match Fee');
        match[p.id][f.id] = mf ? mf.amount.toString() : '';
      }
    }
    setInlineSquadAmounts(squad);
    setInlineMatchAmounts(match);
    (async () => {
      try {
        const [pls, fixs, cfees] = await Promise.all([
          listPlayers(true),
          listFixtures(),
          listClubFees(),
        ]);
        setPlayers(pls);
        setFixtures(fixs);
        setFees(cfees);
        // Fetch availability for all fixtures
        const availPromises = fixs.map(f => getFixtureAvailability(f.id).then(avs => [f.id, avs] as const));
        const availResults = await Promise.all(availPromises);
        const availMap: Record<string, Record<string, 'Available' | 'Not Available'>> = {};
        for (const [fid, avs] of availResults) {
          availMap[fid] = {};
          for (const av of avs) {
            availMap[fid][av.player_id] = av.status;
          }
        }
        setAvailabilityByFixture(availMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const index = useMemo(() => {
    const map = new Map<string, ClubFee>();
    for (const f of fees) {
      const key = `${f.player_id}|${f.fixture_id ?? 'squad'}|${f.category}`;
      map.set(key, f);
    }
    return map;
  }, [fees]);

  function getFee(playerId: string, fixtureId: string | null, category: ClubFee['category']) {
    return index.get(`${playerId}|${fixtureId ?? 'squad'}|${category}`);
  }

  function openEditor(p: Player, f: Fixture | null, defaultCategory: ClubFee['category']) {
    setEditCell({ player: p, fixture: f });
    setCategory(defaultCategory);
  const existing = getFee(p.id, f ? f.id : null, defaultCategory);
  setAmount(existing?.amount ?? (defaultCategory === 'Match Fee' ? 10 : 0));
    setPaidOn(existing?.paid_on ?? new Date().toISOString().slice(0, 10));
    setNotes(existing?.notes ?? '');
    onOpen();
  }

  async function save() {
    if (!editCell) return;
    try {
      const existing = getFee(editCell.player.id, editCell.fixture ? editCell.fixture.id : null, category);
      await upsertClubFee({
        id: existing?.id,
        player_id: editCell.player.id,
        fixture_id: editCell.fixture ? editCell.fixture.id : null,
        category,
        amount,
        paid_on: paidOn || null,
        notes,
      });
      toast({ title: 'Saved', status: 'success' });
      const fresh = await listClubFees();
      setFees(fresh);
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', status: 'error' });
    }
  }



  // Years available from fixtures
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const f of fixtures) {
      const y = new Date(f.fixture_date).getFullYear().toString();
      set.add(y);
    }
    return Array.from(set).sort();
  }, [fixtures]);

  const visibleFixtures = useMemo(() => {
    if (selectedYear === 'all') return fixtures;
    return fixtures.filter(f => new Date(f.fixture_date).getFullYear().toString() === selectedYear);
  }, [fixtures, selectedYear]);

  // Totals
  const squadFeeByPlayer = useMemo(() => {
    const m = new Map<string, ClubFee | undefined>();
    for (const p of players) {
      m.set(p.id, getFee(p.id, null, 'Squad Fee'));
    }
    return m;
  }, [players, index]);

  const matchFeeByPlayerAndFixture = useMemo(() => {
    const m = new Map<string, ClubFee | undefined>();
    for (const p of players) {
      for (const f of visibleFixtures) {
        m.set(`${p.id}|${f.id}`, getFee(p.id, f.id, 'Match Fee'));
      }
    }
    return m;
  }, [players, visibleFixtures, index]);

  // rowTotal and selection functions removed as unused

  // (All unused function bodies fully removed to fix syntax)

  const columnTotals = useMemo(() => {
    const totals: { squad: number; byFixture: Record<string, number>; grand: number } = { squad: 0, byFixture: {}, grand: 0 };
    for (const p of players) {
      const sf = squadFeeByPlayer.get(p.id);
      if (sf) totals.squad += sf.amount;
      for (const f of visibleFixtures) {
        const mf = matchFeeByPlayerAndFixture.get(`${p.id}|${f.id}`);
        if (!totals.byFixture[f.id]) totals.byFixture[f.id] = 0;
        if (mf) totals.byFixture[f.id] += mf.amount;
      }
    }
    totals.grand = totals.squad + Object.values(totals.byFixture).reduce((a, b) => a + b, 0);
    return totals;
  }, [players, visibleFixtures, squadFeeByPlayer, matchFeeByPlayerAndFixture]);

  // All hooks above. Now handle loading state after hooks.
  if (loading) {
    return (
      <Box textAlign="center" py={8}><Spinner /></Box>
    );
  }



  async function exportPDF() {
    try {
      if (!tableRef.current) return;
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 40;
      pdf.setFontSize(14);
      pdf.text(`Fees Matrix${selectedYear !== 'all' ? ' - ' + selectedYear : ''}`, 40, y);
      y += 10;
      pdf.addImage(imgData, 'PNG', 20, y, imgWidth, Math.min(imgHeight, pageHeight - y - 20));
      pdf.save(`fees-matrix${selectedYear !== 'all' ? '-' + selectedYear : ''}.pdf`);
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message || 'Could not export PDF', status: 'error' });
    }
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="md">Fees Matrix</Heading>
        <HStack>
          <FormControl maxW="200px">
            <FormLabel mb={1}>Year</FormLabel>
            <Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">All</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </FormControl>
          <Button size="sm" onClick={exportPDF} colorScheme="purple">Export PDF</Button>
          <Button size="sm" onClick={async () => { setLoading(true); try { const [fixs, cfees] = await Promise.all([listFixtures(), listClubFees()]); setFixtures(fixs); setFees(cfees); } finally { setLoading(false); } }}>Refresh</Button>
        </HStack>
      </HStack>
      <HStack>
        <Box flex={1} />
        <Box fontSize="sm" color="gray.500">Columns update automatically when new fixtures are added; use Refresh if needed.</Box>
      </HStack>
      <Box overflowX="auto" ref={tableRef}>
        <Table size="sm" variant="striped">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Squad Fee</Th>
              {visibleFixtures.map(f => (
                <Th key={f.id} title={`${f.opponent} @ ${f.venue}`}>
                  <VStack spacing={0} align="start">
                    <Box>{new Date(f.fixture_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Box>
                    <Box fontSize="xs" color="gray.600">{f.opponent}</Box>
                  </VStack>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {players.map(p => (
              <Tr key={p.id}>
                <Td>{p.full_name}</Td>
                <Td>
                  {(() => {
                    const cf = getFee(p.id, null, 'Squad Fee');
                    const inlineAmount = inlineSquadAmounts[p.id] ?? '';
                    const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setInlineSquadAmounts(prev => ({ ...prev, [p.id]: val }));
                    };
                    const handleInlineBlur = async () => {
                      const val = inlineAmount;
                      const numVal = Number(val);
                      if (!val || isNaN(numVal)) return;
                      setSavingSquad(prev => ({ ...prev, [p.id]: 'saving' }));
                      try {
                        const today = new Date().toISOString().slice(0, 10);
                        await upsertClubFee({
                          id: cf?.id,
                          player_id: p.id,
                          fixture_id: null,
                          category: 'Squad Fee',
                          amount: numVal,
                          paid_on: today,
                          notes: cf?.notes ?? null
                        });
                        const fresh = await listClubFees();
                        setFees(fresh);
                        setSavingSquad(prev => ({ ...prev, [p.id]: 'saved' }));
                        setTimeout(() => setSavingSquad(prev => ({ ...prev, [p.id]: 'idle' })), 1000);
                      } catch {
                        setSavingSquad(prev => ({ ...prev, [p.id]: 'idle' }));
                      }
                    };
                    return (
                      <HStack>
                        <Tooltip label={cf?.paid_on ? `Paid on ${cf.paid_on}` : 'Unpaid'}>
                          <Badge colorScheme={cf ? (cf.paid_on ? 'green' : 'yellow') : 'gray'}>{cf ? `£${cf.amount}` : '-'}</Badge>
                        </Tooltip>
                        <Input size="xs" width="60px" value={inlineAmount} onChange={handleInlineChange} onBlur={handleInlineBlur} placeholder="£" />
                        {savingSquad[p.id] === 'saving' && <Spinner size="xs" thickness="2px" speed="0.65s" color="purple.500" />}
                        {savingSquad[p.id] === 'saved' && <CheckIcon color="green.500" boxSize={3} />}
                        <IconButton size="xs" aria-label="Edit details" icon={<EditIcon />} onClick={() => openEditor(p, null, 'Squad Fee')} />
                      </HStack>
                    );
                  })()}
                </Td>
                {visibleFixtures.map(f => {
                  const isAvailable = availabilityByFixture[f.id]?.[p.id] === 'Available';
                  const mf = getFee(p.id, f.id, 'Match Fee');
                  const inlineAmount = inlineMatchAmounts[p.id]?.[f.id] ?? '';
                  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    setInlineMatchAmounts(prev => ({
                      ...prev,
                      [p.id]: { ...prev[p.id], [f.id]: val }
                    }));
                  };
                  const handleInlineBlur = async () => {
                    const val = inlineAmount;
                    const numVal = Number(val);
                    if (!val || isNaN(numVal)) return;
                    setSavingMatch(prev => ({
                      ...prev,
                      [p.id]: { ...(prev[p.id] || {}), [f.id]: 'saving' }
                    }));
                    try {
                      const today = new Date().toISOString().slice(0, 10);
                      await upsertClubFee({
                        id: mf?.id,
                        player_id: p.id,
                        fixture_id: f.id,
                        category: 'Match Fee',
                        amount: numVal,
                        paid_on: today,
                        notes: mf?.notes ?? null
                      });
                      const fresh = await listClubFees();
                      setFees(fresh);
                      setSavingMatch(prev => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] || {}), [f.id]: 'saved' }
                      }));
                      setTimeout(() => setSavingMatch(prev => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] || {}), [f.id]: 'idle' }
                      })), 1000);
                    } catch {
                      setSavingMatch(prev => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] || {}), [f.id]: 'idle' }
                      }));
                    }
                  };
                  return (
                    <Td key={f.id} style={isAvailable ? { background: '#d1fae5' } : {}}>
                      <HStack>
                        <Tooltip label={mf?.paid_on ? `Paid on ${mf.paid_on}` : 'Unpaid'}>
                          <Badge colorScheme={mf ? (mf.paid_on ? 'green' : 'yellow') : 'gray'}>{mf ? `£${mf.amount}` : '-'}</Badge>
                        </Tooltip>
                        <Input size="xs" width="60px" value={inlineAmount} onChange={handleInlineChange} onBlur={handleInlineBlur} placeholder="£" />
                        {savingMatch[p.id]?.[f.id] === 'saving' && <Spinner size="xs" thickness="2px" speed="0.65s" color="purple.500" />}
                        {savingMatch[p.id]?.[f.id] === 'saved' && <CheckIcon color="green.500" boxSize={3} />}
                        <IconButton size="xs" aria-label="Edit details" icon={<EditIcon />} onClick={() => openEditor(p, f, 'Match Fee')} />
                        {isAvailable && <Badge colorScheme="teal" variant="subtle">Available</Badge>}
                      </HStack>
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Tbody>
          <Tfoot>
            <Tr>
              <Th colSpan={2}>Totals</Th>
              <Th>£{columnTotals.squad.toFixed(2)}</Th>
              {visibleFixtures.map(f => (
                <Th key={f.id}>£{(columnTotals.byFixture[f.id] || 0).toFixed(2)}</Th>
              ))}
            </Tr>
          </Tfoot>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Fee</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                  <option value="Match Fee">Match Fee</option>
                  <option value="Squad Fee">Squad Fee</option>
                  <option value="Nets">Nets</option>
                  <option value="Chai">Chai</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Amount (£)</FormLabel>
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </FormControl>
              <FormControl>
                <FormLabel>Paid On</FormLabel>
                <Input type="date" value={paidOn ?? ''} onChange={(e) => setPaidOn(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Comments</FormLabel>
                <Textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} placeholder="Notes / comments" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={save}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
