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
} from '@chakra-ui/react';
import { CheckCircleIcon, CalendarIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { useGemini } from '@/_hooks/useGemini';

interface ItemDetail {
  name: string;
  description: string;
  importance: string;
  estimated_budget: string;
  when_to_prepare: string;
  notes: string;
}

// フォーム入力の型定義
interface FormInput {
  text: string;
  who: string;
  when: string;
}

export const Top: React.FC = () => {
  const { register, handleSubmit, watch } = useForm<FormInput>();
  const { fetchCelebrationPlan, isLoading, showResults, response, fetchItemDetail } = useGemini();
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputDate = watch("when")
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = React.useState<{ name: string; detail: string } | null>(null);
  const [itemDetails, setItemDetails] = React.useState<{
    categories: Array<{
      name: string;
      items: ItemDetail[];
    }>;
    total_budget_estimate: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  const handleItemClick = async (item: string) => {
    try {
      setIsLoadingDetails(true);
      const details = await fetchItemDetail(item);
      setItemDetails(details);
      onOpen();
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: '詳細情報の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDetails(false);
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
                        <ListItem key={index} display="flex" alignItems="center">
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          {item}
                        </ListItem>
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
                        <ListItem key={index}>
                          <Text fontWeight="bold" display="flex" alignItems="center">
                            <CalendarIcon mr={2} color="purple.500" />
                            {event.name}
                          </Text>
                          <Text ml={6}>{event.description}</Text>
                        </ListItem>
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
                          <ListItem key={index}>
                            <Text fontWeight="bold">
                              {new Date(schedule.date).toLocaleDateString('ja-JP')}
                            </Text>
                            <Text ml={6}>{schedule.reason}</Text>
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

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>準備物の詳細情報</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingDetails ? (
              <Text>読み込み中...</Text>
            ) : itemDetails ? (
              <VStack spacing={4} align="stretch">
                {itemDetails.categories.map((category, idx) => (
                  <Box key={idx}>
                    <Heading size="md" mb={3}>{category.name}</Heading>
                    {category.items.map((item, itemIdx) => (
                      <Card key={itemIdx} mb={3} variant="outline">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <Heading size="sm">{item.name}</Heading>
                            <Text>{item.description}</Text>
                            <Stack direction={['column', 'row']} spacing={4}>
                              <Text><strong>重要度:</strong> {item.importance}</Text>
                              <Text><strong>予算目安:</strong> {item.estimated_budget}</Text>
                            </Stack>
                            <Text><strong>準備時期:</strong> {item.when_to_prepare}</Text>
                            <Text><strong>注意点:</strong> {item.notes}</Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Box>
                ))}
                <Box borderTop="1px" borderColor="gray.200" pt={4}>
                  <Text fontWeight="bold">
                    予算目安（合計）: {itemDetails.total_budget_estimate}
                  </Text>
                </Box>
              </VStack>
            ) : (
              <Text>詳細情報を取得できませんでした</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
