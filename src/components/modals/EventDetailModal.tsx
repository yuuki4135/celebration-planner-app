import * as React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Text,
  Button,
  Spinner,
  Heading,
  List,
  ListItem,
  HStack,
  SimpleGrid,
  IconButton,
  Badge,
  Tooltip,
  Center,
} from '@chakra-ui/react';
import { CalendarIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { RecommendedDate, EventDetail } from '@/types/celebrationTypes';
import { createGoogleCalendarUrl, createYahooCalendarUrl } from '@/utils/calendar';

interface Shop {
  name: string;
  address: string;
  rating: null;
  place_id: string;
  location: {
    lat: number;
    lon: number;
  };
  category: string;
  website: string | null;
  phone: string | null;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: string | null;
  eventDetails: EventDetail | null;
  isLoadingEventDetails: boolean;
  prefecture?: string | null;
  city?: string | null;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  selectedEvent,
  eventDetails,
  isLoadingEventDetails,
  prefecture,
  city,
}) => {
  const [relatedShops, setRelatedShops] = React.useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = React.useState(false);

  const fetchRelatedShops = React.useCallback(async () => {
    if (!selectedEvent || !prefecture || !city) return;

    setIsLoadingShops(true);
    try {
      const response = await fetch(
        `/api/searchRelatedShops?eventType=${encodeURIComponent(selectedEvent)}&prefecture=${encodeURIComponent(prefecture)}&city=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      setRelatedShops(data.shops);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setIsLoadingShops(false);
    }
  }, [selectedEvent, prefecture, city]);

  React.useEffect(() => {
    if (isOpen && prefecture && city) {
      fetchRelatedShops();
    }
  }, [isOpen, fetchRelatedShops]);

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen} 
      onClose={onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent maxW="4xl">
        <ModalHeader>
          {selectedEvent && `${selectedEvent}の詳細情報`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoadingEventDetails ? (
            <VStack py={8} spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>詳細情報を取得中...</Text>
            </VStack>
          ) : eventDetails && (
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="sm">イベントの説明</Heading>
                <Text mt={2}>{eventDetails.description}</Text>
              </Box>
              <Box>
                <Heading size="sm">文化的な意義</Heading>
                <Text mt={2}>{eventDetails.cultural_significance}</Text>
              </Box>
              <Box>
                <Heading size="sm">推奨日程</Heading>
                <List spacing={2} mt={2}>
                  {eventDetails.recommended_dates.map((date: RecommendedDate, idx: number) => (
                    <ListItem key={idx} p={3} borderWidth="1px" borderRadius="md">
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="flex-start">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">
                              {new Date(date.date).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              })}
                              {date.is_holiday && 
                                <Badge ml={2} colorScheme="red">休日</Badge>
                              }
                            </Text>
                            <Text>{date.reason}</Text>
                            <Text fontSize="sm" color="gray.600">{date.considerations}</Text>
                          </VStack>
                          <HStack spacing={2}>
                            <Tooltip label="Googleカレンダーに追加">
                              <IconButton
                                aria-label="Googleカレンダーに追加"
                                icon={<CalendarIcon />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                                as="a"
                                href={createGoogleCalendarUrl(
                                  selectedEvent || '',
                                  `${date.reason}\n${date.considerations}`,
                                  date.date,
                                  date.time_slots[0]?.start_time,
                                  date.time_slots[0]?.end_time,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            </Tooltip>
                            <Tooltip label="Yahooカレンダーに追加">
                              <IconButton
                                aria-label="Yahooカレンダーに追加"
                                icon={<CalendarIcon />}
                                size="sm"
                                colorScheme="purple"
                                variant="ghost"
                                as="a"
                                href={createYahooCalendarUrl(
                                  selectedEvent || '',
                                  `${date.reason}\n${date.considerations}`,
                                  date.date,
                                  date.time_slots[0]?.start_time,
                                  date.time_slots[0]?.end_time,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            </Tooltip>
                          </HStack>
                        </HStack>
                        <Box pl={4}>
                          <Text fontWeight="bold" mb={2}>推奨時間帯:</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {date.time_slots.map((slot, slotIdx) => (
                              <Box key={slotIdx}>
                                <Text>{slot.start_time} - {slot.end_time}</Text>
                                <Text fontSize="sm" color="gray.600">{slot.reason}</Text>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </Box>
                      </VStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
              {prefecture && city && (
                <Box mt={6}>
                  <Heading size="md" mb={4}>関連施設</Heading>
                  {isLoadingShops ? (
                    <Center py={4}>
                      <Spinner />
                    </Center>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {relatedShops.map((shop) => (
                        <Box
                          key={shop.place_id}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          _hover={{ shadow: 'md' }}
                        >
                          <Heading size="sm" mb={2}>{shop.name}</Heading>
                          <Text fontSize="sm" color="gray.600" mb={2}>{shop.address}</Text>
                          <HStack spacing={2} mb={2}>
                            <Badge colorScheme="blue">{shop.category}</Badge>
                          </HStack>
                          <VStack align="start" spacing={2}>
                            {shop.phone && (
                              <Text fontSize="sm">
                                📞 {shop.phone}
                              </Text>
                            )}
                            {shop.website && (
                              <Button
                                size="sm"
                                rightIcon={<ExternalLinkIcon />}
                                as="a"
                                href={shop.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                ウェブサイト
                              </Button>
                            )}
                            <Button
                              size="sm"
                              rightIcon={<ExternalLinkIcon />}
                              as="a"
                              href={`https://www.openstreetmap.org/?mlat=${shop.location.lat}&mlon=${shop.location.lon}#map=17/${shop.location.lat}/${shop.location.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              地図を表示
                            </Button>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            閉じる
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};