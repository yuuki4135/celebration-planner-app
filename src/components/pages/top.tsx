// import * as React from 'react'
// import { useForm, SubmitHandler } from "react-hook-form";
// import { Box, Button, FormControl, FormLabel, Input, VStack, Text, Spinner, Center } from "@chakra-ui/react";
// import { useGemini } from '@/_hooks/useGemini';

// type FormData = {
//   text: string;
//   who: string;
//   when: Date;
// };
  
// export const Top: React.FC = () => {
//   const { register, handleSubmit } = useForm<FormData>();
//   const { answer, sending, askGemini, checkCelebration, checkCelebrationError } = useGemini();

//   const onSubmit: SubmitHandler<FormData> = ({ text, who, when }) => {
//     askGemini(text, who, when);
//   };

//   return (
//     <Box p={4}>
//       <h1>Top Page</h1>
//       <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4} mt={4}>
//         <FormControl id="text" isInvalid={checkCelebrationError}>
//           <FormLabel>AIに問い合わせる</FormLabel>
//           <Input type="text" {...register("text")} onBlur={ (e) => checkCelebration(e.target.value) } />
//           {checkCelebrationError && <Text color="red.500">お祝い事を入力してください</Text>}
//         </FormControl>
//         <FormControl id="who">
//           <FormLabel>誰のためのお祝い事か</FormLabel>
//           <Input type="text" {...register("who")} />
//         </FormControl>
//         <FormControl id="when">
//           <FormLabel>日程</FormLabel>
//           <Input type="date" {...register("when")} />
//         </FormControl>
//         <Button type="submit" colorScheme="teal" isLoading={sending}>送信</Button>
//       </VStack>
//       {sending && (
//         <Center mt={4}>
//           <Spinner size="xl" color="teal.500" />
//         </Center>
//       )}
//       {answer && (
//         <Box mt={4} p={4} borderWidth="1px" borderRadius="lg">
//           <Text>回答:</Text>
//           <Text>{answer.recipe_name}</Text>
//         </Box>
//       )}
//     </Box>
//   )
// }

import React, { useState } from 'react';
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
  Flex,
  useToast,
  FormControl,
  FormLabel,
  Stack
} from '@chakra-ui/react';
import { CheckCircleIcon, CalendarIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';

// APIレスポンスの型定義
interface Schedule {
  date: string;
  reason: string;
}

interface Event {
  name: string;
  description: string;
}

interface ApiResponse {
  message: string;
  schedule: Schedule[];
  ready: string[];
  events: Event[];
  error: string | null;
}

// フォーム入力の型定義
interface FormInput {
  text: string;
  who: string;
  when: string;
}

export const Top: React.FC = () => {
  // ステート管理
  const [formData, setFormData] = useState<FormInput>({
    text: '',
    who: '',
    when: ''
  });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // 入力変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // API呼び出し
  const fetchCelebrationPlan = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        text: formData.text,
        who: formData.who,
        ...(formData.when && { when: formData.when })
      });

      const response = await fetch(`https://askcelebration-cti2s6vveq-uc.a.run.app?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }

      const data: ApiResponse = await response.json();
      setResponse(data);
      setShowResults(true);
      
      if (data.error) {
        toast({
          title: 'エラーが発生しました',
          description: data.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    fetchCelebrationPlan();
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
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>お祝い事の種類</FormLabel>
                  <Input
                    name="text"
                    placeholder="例: 結婚式、誕生日、出産祝い"
                    value={formData.text}
                    onChange={handleInputChange}
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>誰のためのお祝い？</FormLabel>
                  <Input
                    name="who"
                    placeholder="例: 娘、息子、友人"
                    value={formData.who}
                    onChange={handleInputChange}
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>予定日（任意）</FormLabel>
                  <Input
                    name="when"
                    type="date"
                    value={formData.when}
                    onChange={handleInputChange}
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

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
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
                      <Text>{formData.when ? `${formData.when}に予定されています` : "日程は未定です"}</Text>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          )}
        </Fade>
      </VStack>
    </Container>
  );
};
