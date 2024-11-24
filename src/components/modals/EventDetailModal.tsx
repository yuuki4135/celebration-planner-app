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
} from '@chakra-ui/react';
import { CalendarIcon, ExternalLinkIcon, SearchIcon } from '@chakra-ui/icons';
import { RecommendedDate, EventDetail } from '@/types/celebrationTypes';
import { createGoogleCalendarUrl, createYahooCalendarUrl, createICSFile } from '@/utils/calendar';
import { AiOutlineGoogle, AiFillYahoo } from "react-icons/ai";
import { usePlace } from '@/hooks/usePlace';

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
  const { searchPlaces, resetPlaces, places, isLoading: isLoadingPlaces, error: placesError } = usePlace();
  const [showPlaces, setShowPlaces] = React.useState(false);

  const handleSearchPlaces = async () => {
    if (!prefecture || !city || !selectedEvent) return;
    await searchPlaces(prefecture, city, selectedEvent);
    setShowPlaces(true);
  };

  const closeModal = () => {
    setShowPlaces(false);
    resetPlaces();
    onClose();
  }

  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen} 
      onClose={closeModal}
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
                                icon={<AiOutlineGoogle />}
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
                                icon={<AiFillYahoo />}
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
                            <Tooltip label="iCalendarファイルをダウンロード">
                              <IconButton
                                aria-label="iCalendarファイルをダウンロード"
                                icon={<CalendarIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                as="a"
                                download={`${selectedEvent || ''}.ics`}
                                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(createICSFile(
                                  selectedEvent || '',
                                  `${date.reason}\n${date.considerations}`,
                                  date.date,
                                  date.time_slots[0]?.start_time,
                                  date.time_slots[0]?.end_time,
                                ))}`}
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
              
              {/* 場所検索セクション */}
              {prefecture && city && (
                <Box>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="sm">関連するお店・会場</Heading>
                    <Button
                      leftIcon={<SearchIcon />}
                      colorScheme="blue"
                      size="sm"
                      onClick={handleSearchPlaces}
                      isLoading={isLoadingPlaces}
                    >
                      周辺のお店を検索
                    </Button>
                  </HStack>
                  
                  {showPlaces && (
                    <Box>
                      {placesError ? (
                        <Text color="red.500">{placesError}</Text>
                      ) : places.length > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          {places.map((place) => (
                            <Box
                              key={place.placeId}
                              p={4}
                              borderWidth="1px"
                              borderRadius="md"
                              _hover={{ boxShadow: 'md' }}
                            >
                              <VStack align="stretch" spacing={2}>
                                <Heading size="xs">{place.name}</Heading>
                                <Text fontSize="sm">{place.address}</Text>
                                <HStack>
                                  <Text fontSize="sm">
                                    評価: {place.rating} ({place.userRatingsTotal}件)
                                  </Text>
                                  {place.openNow !== undefined && (
                                    <Badge colorScheme={place.openNow ? 'green' : 'red'}>
                                      {place.openNow ? '営業中' : '営業時間外'}
                                    </Badge>
                                  )}
                                </HStack>
                                <Button
                                  as="a"
                                  href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  rightIcon={<ExternalLinkIcon />}
                                  variant="outline"
                                >
                                  地図を表示
                                </Button>
                              </VStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      ) : (
                        <Text>お店が見つかりませんでした。</Text>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={closeModal}>
            閉じる
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};