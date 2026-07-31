import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GradientButton from "@/components/common/GradientButton";

describe("GradientButton Component", () => {
  it("renders the button title correctly", () => {
    const { getByText } = render(<GradientButton title="Place Order" />);
    expect(getByText("Place Order")).toBeTruthy();
  });

  it("calls onPress function when tapped by user", () => {
    const handlePressMock = jest.fn();
    const { getByText } = render(
      <GradientButton title="Verify OTP" onPress={handlePressMock} />
    );

    const buttonText = getByText("Verify OTP");
    fireEvent.press(buttonText);

    expect(handlePressMock).toHaveBeenCalledTimes(1);
  });
});
