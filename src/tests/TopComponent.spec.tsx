import * as React from "react";
import { Top } from "@/components/pages/top";
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Router, Route, Routes } from 'react-router-dom';
import { useGemini } from "@/hooks/useGemini";
import { usePlace } from "@/hooks/usePlace";
import userEvent from "@testing-library/user-event";
import { ChakraProvider } from "@chakra-ui/react";

const renderWithChakra = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

describe("TopPage", () => {
  it("タイトルが表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });
    expect(screen.getByText("🎉 お祝い事プランナー")).toBeInTheDocument();
  });

  it("お祝い事入力フォームは必須のエラーが表示されること", async () => {
    await act(async() => {
      renderWithChakra(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Top />} />
          </Routes>
        </MemoryRouter>
      );
    });
    userEvent.click(screen.getByRole("button", { name: "プランを作成" }));
    await waitFor(() => {
      expect(screen.getByText("お祝い事を入力してください")).toBeInTheDocument();
    });
  });
});