import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  MdAdd,
  MdArrowForward,
  MdFileDownload,
  MdExpandMore,
} from "react-icons/md";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    children: "Request a Quote",
    variant: "primary",
    isRounded: false,
    isOutline: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary"],
    },
    isRounded: { control: "boolean" },
    isOutline: { control: "boolean" },
    leftIcon: { control: false },
    rightIcon: { control: false },
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

export const Rounded: Story = {
  args: { isRounded: true, children: "Create" },
};

export const OutlinePrimary: Story = {
  args: { isOutline: true, children: "Edit" },
};

export const OutlineSecondary: Story = {
  args: { variant: "secondary", isOutline: true, children: "Cancel" },
};

export const RoundedOutline: Story = {
  args: { isRounded: true, isOutline: true, children: "Download" },
};

export const LeftIcon: Story = {
  args: { isRounded: true, leftIcon: <MdAdd />, children: "Add Product" },
};

export const RightIcon: Story = {
  args: { rightIcon: <MdArrowForward />, children: "Continue" },
};

export const BothIcons: Story = {
  args: {
    leftIcon: <MdFileDownload />,
    rightIcon: <MdExpandMore />,
    children: "Export",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledOutline: Story = {
  args: { disabled: true, isOutline: true, children: "Edit" },
};

export const FullWidth: Story = {
  args: { children: "Submit Inquiry" },
  render: (args) => (
    <div className="w-80">
      <Button {...args} className="w-full" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-stack-md">
      <div className="flex items-center gap-stack-md">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="primary" isOutline>
          Outline Primary
        </Button>
        <Button variant="secondary" isOutline>
          Outline Secondary
        </Button>
      </div>
      <div className="flex items-center gap-stack-md">
        <Button isRounded>Rounded</Button>
        <Button isRounded isOutline leftIcon={<MdFileDownload />}>
          Download
        </Button>
        <Button leftIcon={<MdAdd />}>Add Product</Button>
        <Button rightIcon={<MdArrowForward />}>Continue</Button>
      </div>
      <div className="flex items-center gap-stack-md">
        <Button disabled>Disabled</Button>
        <Button disabled isOutline>
          Disabled Outline
        </Button>
      </div>
    </div>
  ),
};

export const Playground: Story = {
  args: { children: "Save" },
};
