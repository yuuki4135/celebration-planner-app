import * as React from 'react'
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Box,
  Container,
  Input,
  Button,
  VStack,
  SimpleGrid,
  Heading,
  Text,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Fade,
  Card,
  CardHeader,
  CardBody,
  useToast,
  FormControl,
  FormLabel,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  Spinner,
  HStack,
  IconButton,
  Badge,
  Select
} from '@chakra-ui/react';
import { CheckCircleIcon, CalendarIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { useGemini } from '@/_hooks/useGemini';
import { createGoogleCalendarUrl, createYahooCalendarUrl } from '@/utils/calendar';
import { PREFECTURES } from '@/constants/prefectures';

interface ItemDetail {
  name: string;
  description: string;
  importance: string;
  estimated_budget: string;
  when_to_prepare: string;
  notes: string;
  recommendations: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  reason: string;
}

interface RecommendedDate {
  date: string;
  reason: string;
  considerations?: string;
  is_holiday?: boolean;
  time_slots: TimeSlot[];
}

interface EventDetail {
  description: string;
  cultural_significance: string;
  recommended_dates: RecommendedDate[];
}

// フォーム入力の型定義
interface FormInput {
  text: string;
  who: string;
  when: string;
  prefecture?: string;  // optional に変更
  city?: string;       // optional に変更
}

export const Top: React.FC = () => {
  const { register, handleSubmit, watch } = useForm<FormInput>();
  const { fetchCelebrationPlan, isLoading, showResults, response, fetchItemDetail, fetchEventDetail, fetchReadyDetail } = useGemini();
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputDate = watch("when")
  const inputCelebration = watch("text")
  const inputPrefecture = watch("prefecture")
  const inputCity = watch("city")
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [itemDetails, setItemDetails] = React.useState<{
    categories: Array<{
      name: string;
      items: ItemDetail[];
    }>;
    total_budget_estimate: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  const [selectedEvent, setSelectedEvent] = React.useState<string | null>(null);
  const [eventDetails, setEventDetails] = React.useState<EventDetail | null>(null);
  const [isLoadingEventDetails, setIsLoadingEventDetails] = React.useState(false);
  const {
    isOpen: isEventModalOpen,
    onOpen: onEventModalOpen,
    onClose: onEventModalClose
  } = useDisclosure();

  const [selectedReady, setSelectedReady] = React.useState<string | null>(null);
  const [readyDetails, setReadyDetails] = React.useState<{
    title: string;
    overview: string;
    timeline: string;
    steps: Array<{
      step: string;
      description: string;
      duration: string;
      tips: string[];
    }>;
    required_items: string[];
    estimated_cost: string;
    considerations: string[];
  } | null>(null);
  const [isLoadingReadyDetails, setIsLoadingReadyDetails] = React.useState(false);
  const {
    isOpen: isReadyModalOpen,
    onOpen: onReadyModalOpen,
    onClose: onReadyModalClose
  } = useDisclosure();

  const handleItemClick = async (item: string) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);
    onOpen(); // 先にモーダルを開く
    
    try {
      const details = await fetchItemDetail(inputCelebration, item);
      setItemDetails(details);
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '詳細情報の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      onClose(); // エラー時はモーダルを閉じる
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEventClick = async (eventName: string) => {
    setSelectedEvent(eventName);
    setIsLoadingEventDetails(true);
    onEventModalOpen(); // 先にモーダルを開く
    
    try {
      const details = await fetchEventDetail({
        celebration: inputCelebration,
        event: eventName,
        prefecture: inputPrefecture,
        city: inputCity
      });
      setEventDetails(details.eventDetails);
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: 'イベント詳細の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onEventModalClose(); // エラー時はモーダルを閉じる
    } finally {
      setIsLoadingEventDetails(false);
    }
  };

  const handleReadyClick = async (item: string) => {
    setSelectedReady(item);
    setIsLoadingReadyDetails(true);
    onReadyModalOpen();
    
    try {
      const details = await fetchReadyDetail(inputCelebration, item);
      setReadyDetails(details);
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '準備詳細の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onReadyModalClose();
    } finally {
      setIsLoadingReadyDetails(false);
    }
  };

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    try{
      const response = await fetchCelebrationPlan(data);
      if (response.error) {
        toast({
          title: 'エラーが発生しました',
          description: response.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'エラーが発生しました',
        description: '予期せぬエラーが発生しました。しばらくしてから再度お試しください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading size="xl" mb={2}>🎉 お祝い事プランナー</Heading>
          <Text color="gray.600">お祝い事の準備をサポートいたします</Text>
        </Box>

        <Card w="full" variant="outline" borderColor={borderColor}>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>お祝い事の種類</FormLabel>
                  <Input
                    {...register("text", { required: true } ) }
                    placeholder="例: 結婚式、誕生日、出産祝い"
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>誰のためのお祝い？</FormLabel>
                  <Input
                    placeholder="例: 娘、息子、友人"
                    {...register("who", { required: true } ) }
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>予定日（任意）</FormLabel>
                  <Input
                    type="date"
                    {...register("when") }
                    size="lg"
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>都道府県（任意）</FormLabel>
                    <Select
                      {...register("prefecture")}
                      placeholder="都道府県を選択"
                      size="lg"
                    >
                      {PREFECTURES.map((pref) => (
                        <option key={pref} value={pref}>
                          {pref}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>市区町村（任意）</FormLabel>
                    <Input
                      {...register("city")}
                      placeholder="例: 渋谷区"
                      size="lg"
                    />
                  </FormControl>
                </SimpleGrid>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="プラン作成中..."
                  w="full"
                >
                  プランを作成
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>

        <Fade in={showResults}>
          {showResults && response && (
            <VStack spacing={6} w="full">
              <Card w="full" variant="outline" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">概要</Heading>
                </CardHeader>
                <CardBody>
                  <Text>{response.message}</Text>
                </CardBody>
              </Card>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
                <Card variant="outline" borderColor={borderColor} h="full">
                  <CardHeader>
                    <Heading size="md" display="flex" alignItems="center">
                      <CheckCircleIcon mr={2} color="green.500" />
                      準備リスト
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <List spacing={3}>
                      {response.ready.map((item, index) => (
                        <Tooltip
                          key={index}
                          label="クリックして詳しく見る"
                          placement="top-start"
                        >
                          <ListItem
                            cursor="pointer"
                            onClick={() => handleReadyClick(item)}
                            _hover={{ color: 'blue.500' }}
                            display="flex"
                            alignItems="center"
                          >
                            <ListIcon as={CheckCircleIcon} color="green.500" />
                            {item}
                          </ListItem>
                        </Tooltip>
                      ))}
                    </List>
                  </CardBody>
                </Card>

                <Card variant="outline" borderColor={borderColor} h="full">
                  <CardHeader>
                    <Heading size="md" display="flex" alignItems="center">
                      <CheckCircleIcon mr={2} color="orange.500" />
                      準備物リスト
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <List spacing={3}>
                      {response.items?.map((item, index) => (
                        <Tooltip 
                          key={index}
                          label="クリックして詳しく見る"
                          placement="top-start"
                        >
                          <ListItem 
                            display="flex" 
                            alignItems="center"
                            cursor="pointer"
                            onClick={() => handleItemClick(item)}
                            _hover={{ color: 'blue.500' }}
                          >
                            <ListIcon as={CheckCircleIcon} color="orange.500" />
                            {item}
                          </ListItem>
                        </Tooltip>
                      ))}
                    </List>
                  </CardBody>
                </Card>

                <Card variant="outline" borderColor={borderColor} h="full">
                  <CardHeader>
                    <Heading size="md" display="flex" alignItems="center">
                      <StarIcon mr={2} color="purple.500" />
                      関連イベント
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <List spacing={3}>
                      {response.events.map((event, index) => (
                        <Tooltip 
                          key={index}
                          label="クリックして詳しく見る"
                          placement="top-start"
                        >
                          <ListItem 
                            cursor="pointer"
                            onClick={() => handleEventClick(event)}
                            _hover={{ color: 'blue.500' }}
                            display="flex"
                            alignItems="center"
                          >
                            <CalendarIcon mr={2} color="purple.500" />
                            <Text>{event}</Text>
                          </ListItem>
                        </Tooltip>
                      ))}
                    </List>
                  </CardBody>
                </Card>

                <Card variant="outline" borderColor={borderColor} h="full">
                  <CardHeader>
                    <Heading size="md" display="flex" alignItems="center">
                      <TimeIcon mr={2} color="blue.500" />
                      推奨日程
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    {response.schedule.length > 0 ? (
                      <List spacing={3}>
                        {response.schedule.map((schedule, index) => (
                          <ListItem key={index} p={3} borderWidth="1px" borderRadius="md">
                            <VStack align="stretch" spacing={2}>
                              <Text fontWeight="bold">
                                {new Date(schedule.date).toLocaleDateString('ja-JP')}
                              </Text>
                              <Text>{schedule.reason}</Text>
                              <HStack spacing={2} justify="flex-end">
                                <Tooltip label="Googleカレンダーに追加">
                                  <IconButton
                                    aria-label="Googleカレンダーに追加"
                                    icon={<CalendarIcon />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    as="a"
                                    href={createGoogleCalendarUrl(
                                      inputCelebration,
                                      schedule.reason,
                                      schedule.date
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
                                      inputCelebration,
                                      schedule.reason,
                                      schedule.date
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                </Tooltip>
                              </HStack>
                            </VStack>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Text>{inputDate ? `${inputDate}に予定されています` : "日程は未定です"}</Text>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          )}
        </Fade>
      </VStack>

      <Modal
        closeOnOverlayClick={false}
        isOpen={isOpen} 
        onClose={() => {
          onClose();
          setSelectedItem(null);
          setItemDetails(null);
        }} 
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedItem && `${selectedItem}の詳細情報`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingDetails ? (
              <VStack py={8} spacing={4}>
                <Spinner size="xl" color="blue.500" />
                <Text>詳細情報を取得中...</Text>
              </VStack>
            ) : itemDetails && (
              <VStack spacing={6} align="stretch">
                {itemDetails.categories.map((category, idx) => (
                  <Box key={idx}>
                    <Heading size="md" mb={4}>{category.name}</Heading>
                    {category.items.map((item, itemIdx) => (
                      <Card key={itemIdx} mb={4}>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <Text><strong>{item.name}</strong></Text>
                            <Text>{item.description}</Text>
                            <SimpleGrid columns={2} spacing={4}>
                              <Box>
                                <Text fontWeight="bold">予算目安:</Text>
                                <Text>{item.estimated_budget}</Text>
                              </Box>
                              <Box>
                                <Text fontWeight="bold">準備時期:</Text>
                                <Text>{item.when_to_prepare}</Text>
                              </Box>
                            </SimpleGrid>
                            <Box>
                              <Text fontWeight="bold">選び方のコツ・注意点:</Text>
                              <Text>{item.notes}</Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">🎯 おすすめポイント・運気アップ:</Text>
                              <Text>{item.recommendations}</Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Box>
                ))}
                <Box borderTop="1px" borderColor={borderColor} pt={4}>
                  <Text fontWeight="bold">合計予算目安:</Text>
                  <Text>{itemDetails.total_budget_estimate}</Text>
                </Box>
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

      <Modal
        closeOnOverlayClick={false}
        isOpen={isEventModalOpen} 
        onClose={() => {
          onEventModalClose();
          setSelectedEvent(null);
          setEventDetails(null);
        }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
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
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                              {date.time_slots.map((slot, slotIdx) => (
                                <Box 
                                  key={slotIdx} 
                                  p={2} 
                                  bg="gray.50" 
                                  borderRadius="md"
                                >
                                  <Text fontWeight="semibold">
                                    {slot.start_time} 〜 {slot.end_time}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {slot.reason}
                                  </Text>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        </VStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                {/* 他の詳細情報も同様に表示 */}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onEventModalClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        closeOnOverlayClick={false}
        isOpen={isReadyModalOpen}
        onClose={() => {
          onReadyModalClose();
          setSelectedReady(null);
          setReadyDetails(null);
        }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedReady && `${selectedReady}の詳細情報`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingReadyDetails ? (
              <VStack py={8} spacing={4}>
                <Spinner size="xl" color="blue.500" />
                <Text>詳細情報を取得中...</Text>
              </VStack>
            ) : readyDetails && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="sm">概要</Heading>
                  <Text mt={2}>{readyDetails.overview}</Text>
                </Box>
                <Box>
                  <Heading size="sm">タイムライン</Heading>
                  <Text mt={2}>{readyDetails.timeline}</Text>
                </Box>
                <Box>
                  <Heading size="sm">手順</Heading>
                  <List spacing={4} mt={2}>
                    {readyDetails.steps.map((step, idx) => (
                      <ListItem key={idx} p={4} borderWidth="1px" borderRadius="md">
                        <VStack align="stretch" spacing={2}>
                          <Heading size="xs">{step.step}</Heading>
                          <Text>{step.description}</Text>
                          <Text color="gray.600" fontSize="sm">所要時間: {step.duration}</Text>
                          {step.tips.length > 0 && (
                            <Box>
                              <Text fontWeight="bold">Tips:</Text>
                              <List styleType="disc" pl={4}>
                                {step.tips.map((tip, tipIdx) => (
                                  <ListItem key={tipIdx}>{tip}</ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </VStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Heading size="sm">必要なもの</Heading>
                    <List styleType="disc" pl={4} mt={2}>
                      {readyDetails.required_items.map((item, idx) => (
                        <ListItem key={idx}>{item}</ListItem>
                      ))}
                    </List>
                  </Box>
                  <Box>
                    <Heading size="sm">見積もり費用</Heading>
                    <Text mt={2}>{readyDetails.estimated_cost}</Text>
                  </Box>
                </SimpleGrid>
                <Box>
                  <Heading size="sm">注意点</Heading>
                  <List styleType="disc" pl={4} mt={2}>
                    {readyDetails.considerations.map((item, idx) => (
                      <ListItem key={idx}>{item}</ListItem>
                    ))}
                  </List>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onReadyModalClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
