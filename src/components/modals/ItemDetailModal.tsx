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
  Card,
  CardBody,
  HStack,
  SimpleGrid,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon, StarIcon } from '@chakra-ui/icons';
import { ItemDetail } from '@/types/celebrationTypes';
import { CelebrationCarousel } from '@/components/modals/CelebrationCarousel';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: string | null;
  itemDetails: {
    categories: Array<{
      name: string;
      items: ItemDetail[];
    }>;
    total_budget_estimate: string;
  } | null;
  isLoadingDetails: boolean;
  searchingItemId: string | null;
  itemSpecificProducts: {
    [key: string]: Array<{
      itemName: string;
      itemPrice: number;
      itemUrl: string;
      imageUrl: string;
      shopName: string;
      reviewAverage: number;
    }>;
  };
  handleSearchItemProducts: (itemName: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  itemDetails,
  isLoadingDetails,
  searchingItemId,
  itemSpecificProducts,
  handleSearchItemProducts,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const renderProductCard = (product: any) => (
    <Card
      minW="250px"
      maxW="250px"
      _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.2s' }}
    >
      <CardBody>
        <Image
          src={product.imageUrl}
          alt={product.itemName}
          height="150px"
          objectFit="cover"
          borderRadius="md"
        />
        <VStack align="stretch" mt={4} spacing={2}>
          <Text noOfLines={2} fontSize="sm" fontWeight="bold">
            {product.itemName}
          </Text>
          <Text color="blue.600" fontSize="lg" fontWeight="bold">
            ¥{product.itemPrice.toLocaleString()}
          </Text>
          <HStack>
            <StarIcon color="yellow.400" />
            <Text fontSize="sm">{product.reviewAverage}</Text>
          </HStack>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {product.shopName}
          </Text>
          <Button
            as="a"
            href={product.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            colorScheme="blue"
          >
            商品を見る
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="6xl">
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
                          <HStack justify="space-between" align="center">
                            <Text><strong>{item.name}</strong></Text>
                            <Button
                              size="sm"
                              colorScheme="pink"
                              leftIcon={<SearchIcon />}
                              isLoading={searchingItemId === item.name}
                              onClick={() => handleSearchItemProducts(item.name)}
                              data-testid={`search-item-${itemIdx}`}
                            >
                              商品を探す
                            </Button>
                          </HStack>
                          
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
                          
                          {itemSpecificProducts[item.name] && (
                            <Box>
                              <Heading size="sm" mb={4}>おすすめ商品</Heading>
                              {itemSpecificProducts[item.name].length ? (
                                <CelebrationCarousel> 
                                  {itemSpecificProducts[item.name].map((product, idx) => (
                                    renderProductCard(product)
                                  ))}
                                </CelebrationCarousel>
                                ) : (
                                <Text>商品が見つかりませんでした。</Text>
                              )}
                            </Box>
                          )}
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
  );
};