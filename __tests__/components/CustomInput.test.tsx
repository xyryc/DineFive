import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import CustomInput from "@/components/auth/CustomInput";

describe("CustomInput Component", () => {
  it("1. Renders label and placeholder correctly", () => {
    const { getByText, getByPlaceholderText } = render(
      <CustomInput label="Email Address" placeholder="enter email here" />
    );

    expect(getByText("Email Address")).toBeTruthy();
    expect(getByPlaceholderText("enter email here")).toBeTruthy();
  });

  it("2. Triggers onChangeText when user types into the input", () => {
    const handleChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <CustomInput
        placeholder="Enter text"
        onChangeText={handleChangeTextMock}
      />
    );

    const input = getByPlaceholderText("Enter text");
    fireEvent.changeText(input, "mdnabi.office@gmail.com");

    expect(handleChangeTextMock).toHaveBeenCalledWith("mdnabi.office@gmail.com");
    expect(handleChangeTextMock).toHaveBeenCalledTimes(1);
  });

  it("3. Renders leftIcon and right icon elements when provided", () => {
    const { getByText } = render(
      <CustomInput
        placeholder="Password"
        leftIcon={<Text>LockIcon</Text>}
        icon={<Text>EyeIcon</Text>}
      />
    );

    expect(getByText("LockIcon")).toBeTruthy();
    expect(getByText("EyeIcon")).toBeTruthy();
  });

  it("4. Accepts secureTextEntry for password fields", () => {
    const { getByPlaceholderText } = render(
      <CustomInput placeholder="Password" secureTextEntry={true} />
    );

    const input = getByPlaceholderText("Password");
    expect(input.props.secureTextEntry).toBe(true);
  });
});
