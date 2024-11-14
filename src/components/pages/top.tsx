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
  useDisclosure,
  Tooltip,
  HStack,
  IconButton,
  Select,
} from '@chakra-ui/react';
import { CheckCircleIcon, CalendarIcon, StarIcon, TimeIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import { useGemini } from '@/hooks/useGemini';
import { createGoogleCalendarUrl, createYahooCalendarUrl } from '@/utils/calendar';
import { PREFECTURES } from '@/constants/prefectures';
import { ItemDetail, TimeSlot, RecommendedDate, EventDetail, FormInput } from '@/types/celebrationTypes';
import { ItemDetailModal } from '@/components/modals/ItemDetailModal';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { ReadyDetailModal } from '@/components/modals/ReadyDetailModal';

export const Top: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInput>();
  const { fetchCelebrationPlan, isLoading, showResults, response, fetchItemDetail, fetchEventDetail, fetchReadyDetail, fetchRelatedItems } = useGemini();
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

  // 特定のアイテムに対する商品検索状態を管理
  const [searchingItemId, setSearchingItemId] = React.useState<string | null>(null);
  const [itemSpecificProducts, setItemSpecificProducts] = React.useState<{
    [key: string]: Array<{
      itemName: string;
      itemPrice: number;
      itemUrl: string;
      imageUrl: string;
      shopName: string;
      reviewAverage: number;
    }>;
  }>({});

  // 特定のアイテムの商品を検索
  const handleSearchItemProducts = async (itemName: string) => {
    setSearchingItemId(itemName);
    try {
      const items = await fetchRelatedItems(`${itemName} ${inputCelebration}`);
      setItemSpecificProducts(prev => ({
        ...prev,
        [itemName]: items
      }));
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '商品の検索に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSearchingItemId(null);
    }
  };

  const handleItemClick = async (item: string) => {
    setSelectedItem(item);
    setIsLoadingDetails(true);
    onOpen();
    
    try {
      setItemDetails(await fetchItemDetail(inputCelebration, item));
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '情報の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEventClick = async (eventName: string) => {
    setSelectedEvent(eventName);
    setIsLoadingEventDetails(true);
    onEventModalOpen();
    
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
      setReadyDetails(await fetchReadyDetail(inputCelebration, item),);
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '情報の取得に失敗しました',
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
                <FormControl isInvalid={Boolean(errors.text)}>
                  <FormLabel>お祝い事の種類</FormLabel>
                  <Input
                    {...register("text", { required: "お祝い事を入力してください" })}
                    placeholder="例: 結婚式、誕生日、出産祝い"
                    size="lg"
                  />
                </FormControl>
                <h1>{JSON.stringify(errors)}</h1>

                <FormControl isRequired>
                  <FormLabel>誰のためのお祝い？</FormLabel>
                  <Input
                    placeholder="例: 娘、息子、恋人"
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

      <ItemDetailModal
        isOpen={isOpen}
        onClose={onClose}
        selectedItem={selectedItem}
        itemDetails={itemDetails}
        isLoadingDetails={isLoadingDetails}
        searchingItemId={searchingItemId}
        itemSpecificProducts={itemSpecificProducts}
        handleSearchItemProducts={handleSearchItemProducts}
      />

      <EventDetailModal
        isOpen={isEventModalOpen}
        onClose={() => {
          onEventModalClose();
          setSelectedEvent(null);
          setEventDetails(null);
        }}
        selectedEvent={selectedEvent}
        eventDetails={eventDetails}
        isLoadingEventDetails={isLoadingEventDetails}
        prefecture={inputPrefecture}
        city={inputCity}
      />

      <ReadyDetailModal
        isOpen={isReadyModalOpen}
        onClose={() => {
          onReadyModalClose();
          setSelectedReady(null);
          setReadyDetails(null);
        }}
        selectedReady={selectedReady}
        readyDetails={readyDetails}
        isLoadingReadyDetails={isLoadingReadyDetails}
      />

    </Container>
  );
};
