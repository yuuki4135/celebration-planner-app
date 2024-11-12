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
  Divider,
} from '@chakra-ui/react';

interface ReadyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReady: string | null;
  readyDetails: {
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
  } | null;
  isLoadingReadyDetails: boolean;
}

export const ReadyDetailModal: React.FC<ReadyDetailModalProps> = ({
  isOpen,
  onClose,
  selectedReady,
  readyDetails,
  isLoadingReadyDetails
}) => {
  return (
    <Modal
      closeOnOverlayClick={false}
      isOpen={isOpen} 
      onClose={onClose}
      size="xl"
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent maxW="6xl" my={4}>
        <ModalHeader borderTopRadius="md" py={6}>
          {selectedReady && `${selectedReady}の詳細情報`}
        </ModalHeader>
        <ModalCloseButton top={6} />
        <ModalBody px={8} py={6}>
          {isLoadingReadyDetails ? (
            <VStack py={8} spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>詳細情報を取得中...</Text>
            </VStack>
          ) : readyDetails && (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="md" mb={4} color="blue.600">{readyDetails.title}</Heading>
                <Text fontSize="lg">{readyDetails.overview}</Text>
              </Box>
              <Divider />
              <Box>
                <Heading size="sm" mb={3} color="blue.500">タイムライン</Heading>
                <Text pl={4}>{readyDetails.timeline}</Text>
              </Box>
              <Divider />
              <Box>
                <Heading size="sm" mb={4} color="blue.500">ステップ</Heading>
                {readyDetails.steps.map((step, idx) => (
                  <Box key={idx} mb={6} pl={4}>
                    <Text fontWeight="bold" fontSize="lg" mb={2}>{step.step}</Text>
                    <Text mb={2}>{step.description}</Text>
                    <Text mb={2} color="gray.600">所要時間: {step.duration}</Text>
                    <Text fontWeight="medium" mb={1}>コツ:</Text>
                    <List styleType="disc" pl={6} spacing={1}>
                      {step.tips.map((tip, tipIdx) => (
                        <ListItem key={tipIdx}>{tip}</ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Box>
              <Divider />
              <Box>
                <Heading size="sm" mb={3} color="blue.500">必要な物</Heading>
                <List styleType="disc" pl={6} spacing={2}>
                  {readyDetails.required_items.map((item, idx) => (
                    <ListItem key={idx}>{item}</ListItem>
                  ))}
                </List>
              </Box>
              <Divider />
              <Box>
                <Heading size="sm" mb={3} color="blue.500">予算目安</Heading>
                <Text pl={4} fontSize="lg" fontWeight="medium">{readyDetails.estimated_cost}</Text>
              </Box>
              <Divider />
              <Box>
                <Heading size="sm" mb={3} color="blue.500">考慮事項</Heading>
                <List styleType="disc" pl={6} spacing={2}>
                  {readyDetails.considerations.map((consideration, idx) => (
                    <ListItem key={idx}>{consideration}</ListItem>
                  ))}
                </List>
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter borderTop="1px" borderColor="gray.100" py={4}>
          <Button colorScheme="blue" onClick={onClose}>
            閉じる
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};