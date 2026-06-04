import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    children: "Request a Quote",
    variant: "primary",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary"],
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "View Catalog" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const FullWidth: Story = {
  args: { children: "Submit Inquiry" },
  render: (args) => (
    <div className="w-80">
      <Button {...args} className="w-full" />
    </div>
  ),
};

export const BothVariants: Story = {
  render: () => (
    <div className="flex gap-stack-md">
      <Button variant="primary">Request a Quote</Button>
      <Button variant="secondary">View Catalog</Button>
    </div>
  ),
};
