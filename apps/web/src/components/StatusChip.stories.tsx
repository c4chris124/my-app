import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusChip } from "./StatusChip";

const meta = {
  title: "Components/StatusChip",
  component: StatusChip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { state: "available" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["available", "limited", "out"],
    },
  },
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = { args: { state: "available" } };
export const Limited: Story = { args: { state: "limited" } };
export const OutOfStock: Story = { args: { state: "out" } };

export const AllStates: Story = {
  render: () => (
    <div className="flex gap-stack-sm">
      <StatusChip state="available" />
      <StatusChip state="limited" />
      <StatusChip state="out" />
    </div>
  ),
};
