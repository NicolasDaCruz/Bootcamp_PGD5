'use client';

/**
 * UI Component Showcase Page
 * Comprehensive testing and documentation for all design system components
 */

import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Loading,
  ButtonLoading,
  PageLoading,
  InlineLoading,
} from '@/components/ui';
import type {
  ColorVariant,
  SizeVariant,
  AnimationVariant,
  SelectOption,
} from '@/components/ui';

export default function ShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('buttons');

  const colorVariants: ColorVariant[] = ['primary', 'secondary', 'accent', 'success', 'warning', 'error'];
  const sizeVariants: SizeVariant[] = ['sm', 'md', 'lg', 'xl'];
  const animationVariants: AnimationVariant[] = ['none', 'pulse', 'grow', 'grow-lg'];

  const selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'disabled', label: 'Disabled Option', disabled: true },
  ];

  const components = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'selects', label: 'Selects' },
    { id: 'cards', label: 'Cards' },
    { id: 'modals', label: 'Modals' },
    { id: 'loading', label: 'Loading' },
    { id: 'responsive', label: 'Responsive' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  const ComponentSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  const VariantGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {children}
    </div>
  );

  const CodeExample = ({ code }: { code: string }) => (
    <Card className="mt-4" style="outlined">
      <CardContent className="p-4">
        <pre className="text-sm overflow-x-auto">
          <code className="text-gray-800">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-heading-lg font-bold">UI Component Showcase</h1>
            <div className="text-sm text-gray-600">
              Design System v1.0 | {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Navigation Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Components</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {components.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => setSelectedComponent(component.id)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedComponent === component.id
                          ? 'bg-accent text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {component.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Buttons Section */}
            {selectedComponent === 'buttons' && (
              <div>
                <ComponentSection title="Button Variants">
                  <div className="space-y-6">
                    {/* Style Variants */}
                    <div>
                      <h3 className="text-heading-sm mb-4">Style Variants</h3>
                      <VariantGrid>
                        <Button style="filled" variant="primary">Filled Primary</Button>
                        <Button style="outlined" variant="primary">Outlined Primary</Button>
                        <Button style="ghost" variant="primary">Ghost Primary</Button>
                        <Button style="link" variant="primary">Link Primary</Button>
                      </VariantGrid>
                    </div>

                    {/* Color Variants */}
                    <div>
                      <h3 className="text-heading-sm mb-4">Color Variants</h3>
                      <VariantGrid>
                        {colorVariants.map((variant) => (
                          <Button key={variant} variant={variant} className="capitalize">
                            {variant}
                          </Button>
                        ))}
                      </VariantGrid>
                    </div>

                    {/* Size Variants */}
                    <div>
                      <h3 className="text-heading-sm mb-4">Size Variants</h3>
                      <VariantGrid>
                        {sizeVariants.map((size) => (
                          <Button key={size} size={size} className="capitalize">
                            Size {size}
                          </Button>
                        ))}
                      </VariantGrid>
                    </div>

                    {/* Animation Variants */}
                    <div>
                      <h3 className="text-heading-sm mb-4">Animation Variants</h3>
                      <VariantGrid>
                        {animationVariants.map((animation) => (
                          <Button key={animation} animation={animation} className="capitalize">
                            {animation === 'none' ? 'No Animation' : animation}
                          </Button>
                        ))}
                      </VariantGrid>
                    </div>

                    {/* States */}
                    <div>
                      <h3 className="text-heading-sm mb-4">Button States</h3>
                      <VariantGrid>
                        <Button>Normal</Button>
                        <Button disabled>Disabled</Button>
                        <Button loading>Loading</Button>
                        <Button iconOnly>🏠</Button>
                        <Button fullWidth>Full Width</Button>
                      </VariantGrid>
                    </div>
                  </div>

                  <CodeExample code={`import { Button } from '@/components/ui';

<Button variant="primary" size="md" animation="grow">
  Click me
</Button>

<Button style="outlined" variant="accent" loading>
  Loading...
</Button>`} />
                </ComponentSection>
              </div>
            )}

            {/* Inputs Section */}
            {selectedComponent === 'inputs' && (
              <div>
                <ComponentSection title="Input Components">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Basic Inputs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Default Input"
                          placeholder="Enter text..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Input
                          label="Email Input"
                          type="email"
                          placeholder="email@example.com"
                        />
                        <Input
                          label="Password Input"
                          type="password"
                          placeholder="Password"
                        />
                        <Input
                          label="Required Field"
                          placeholder="Required field"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Input States</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Error State"
                          placeholder="Invalid input"
                          error={true}
                          errorMessage="This field is required"
                        />
                        <Input
                          label="Disabled Input"
                          placeholder="Disabled"
                          disabled
                        />
                        <Input
                          label="Loading Input"
                          placeholder="Loading..."
                          loading
                        />
                        <Input
                          label="With Helper Text"
                          placeholder="Helper text example"
                          helperText="This is helper text"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Size Variants</h3>
                      <div className="space-y-4">
                        {sizeVariants.map((size) => (
                          <Input
                            key={size}
                            label={`Size ${size}`}
                            placeholder={`Input size ${size}`}
                            size={size}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <CodeExample code={`import { Input } from '@/components/ui';

<Input
  label="User Email"
  type="email"
  placeholder="Enter your email"
  error={hasError}
  errorMessage="Please enter a valid email"
  required
/>`} />
                </ComponentSection>
              </div>
            )}

            {/* Selects Section */}
            {selectedComponent === 'selects' && (
              <div>
                <ComponentSection title="Select Components">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Basic Selects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Default Select"
                          placeholder="Choose an option"
                          options={selectOptions}
                          value={selectValue}
                          onChange={(e) => setSelectValue(e.target.value)}
                        />
                        <Select
                          label="Required Select"
                          placeholder="Required selection"
                          options={selectOptions}
                          required
                        />
                        <Select
                          label="Error State"
                          placeholder="Invalid selection"
                          options={selectOptions}
                          error={true}
                          errorMessage="Please make a selection"
                        />
                        <Select
                          label="Disabled Select"
                          placeholder="Disabled"
                          options={selectOptions}
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Size Variants</h3>
                      <div className="space-y-4">
                        {sizeVariants.map((size) => (
                          <Select
                            key={size}
                            label={`Size ${size}`}
                            placeholder={`Select size ${size}`}
                            options={selectOptions}
                            size={size}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <CodeExample code={`import { Select } from '@/components/ui';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<Select
  label="Choose Option"
  options={options}
  placeholder="Select..."
  value={value}
  onChange={handleChange}
/>`} />
                </ComponentSection>
              </div>
            )}

            {/* Cards Section */}
            {selectedComponent === 'cards' && (
              <div>
                <ComponentSection title="Card Components">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Card Styles</h3>
                      <VariantGrid>
                        <Card style="default">
                          <CardContent>Default Card</CardContent>
                        </Card>
                        <Card style="outlined">
                          <CardContent>Outlined Card</CardContent>
                        </Card>
                        <Card style="filled" variant="accent">
                          <CardContent>Filled Card</CardContent>
                        </Card>
                        <Card style="glass">
                          <CardContent>Glass Card</CardContent>
                        </Card>
                      </VariantGrid>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Card Composition</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card hoverable>
                          <CardHeader>
                            <CardTitle>Card with Header</CardTitle>
                          </CardHeader>
                          <CardContent>
                            This card demonstrates the composition pattern with header, content, and footer.
                          </CardContent>
                          <CardFooter>
                            <Button size="sm">Action</Button>
                          </CardFooter>
                        </Card>

                        <Card animation="grow">
                          <CardHeader>
                            <CardTitle>Animated Card</CardTitle>
                          </CardHeader>
                          <CardContent>
                            This card has hover animations enabled.
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <CodeExample code={`import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

<Card hoverable animation="grow">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here.
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`} />
                </ComponentSection>
              </div>
            )}

            {/* Modals Section */}
            {selectedComponent === 'modals' && (
              <div>
                <ComponentSection title="Modal Components">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Modal Triggers</h3>
                      <VariantGrid>
                        <Button onClick={() => setModalOpen(true)}>
                          Open Modal
                        </Button>
                      </VariantGrid>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Modal Features</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Backdrop click to close (configurable)</li>
                        <li>Escape key to close (configurable)</li>
                        <li>Focus management and trap</li>
                        <li>Portal rendering for proper z-index</li>
                        <li>Smooth animations</li>
                        <li>Accessibility compliant</li>
                        <li>Multiple sizes (sm, md, lg, xl, full)</li>
                      </ul>
                    </div>
                  </div>

                  <CodeExample code={`import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <ModalBody>
    Modal content goes here.
  </ModalBody>
  <ModalFooter>
    <Button onClick={() => setIsOpen(false)}>Close</Button>
  </ModalFooter>
</Modal>`} />
                </ComponentSection>
              </div>
            )}

            {/* Loading Section */}
            {selectedComponent === 'loading' && (
              <div>
                <ComponentSection title="Loading Components">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Loading Styles</h3>
                      <VariantGrid>
                        <div className="text-center">
                          <Loading style="spinner" size="md" />
                          <p className="mt-2 text-sm text-gray-600">Spinner</p>
                        </div>
                        <div className="text-center">
                          <Loading style="dots" size="md" />
                          <p className="mt-2 text-sm text-gray-600">Dots</p>
                        </div>
                        <div className="text-center">
                          <Loading style="pulse" size="md" />
                          <p className="mt-2 text-sm text-gray-600">Pulse</p>
                        </div>
                      </VariantGrid>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Loading Variants</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <ButtonLoading />
                          <span>Button Loading</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <InlineLoading />
                          <span>Inline Loading</span>
                        </div>
                        <div>
                          <Loading style="skeleton" />
                          <p className="mt-2 text-sm text-gray-600">Skeleton Loading</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Loading with Text</h3>
                      <div className="space-y-4">
                        <Loading style="spinner" text="Loading data..." centered />
                        <Loading style="dots" text="Processing..." />
                      </div>
                    </div>
                  </div>

                  <CodeExample code={`import { Loading, ButtonLoading, PageLoading, InlineLoading } from '@/components/ui';

// Different loading styles
<Loading style="spinner" size="lg" text="Loading..." />
<Loading style="skeleton" />

// Specialized loading components
<ButtonLoading />
<InlineLoading />
<PageLoading text="Loading page..." />`} />
                </ComponentSection>
              </div>
            )}

            {/* Responsive Section */}
            {selectedComponent === 'responsive' && (
              <div>
                <ComponentSection title="Responsive Design Testing">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Breakpoint Indicators</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="text-center">
                          <CardContent>
                            <div className="block sm:hidden text-error">XS (&lt;640px)</div>
                            <div className="hidden sm:block md:hidden text-success">SM (≥640px)</div>
                            <div className="hidden md:block lg:hidden text-success">MD (≥768px)</div>
                            <div className="hidden lg:block xl:hidden text-success">LG (≥1024px)</div>
                            <div className="hidden xl:block text-success">XL (≥1280px)</div>
                          </CardContent>
                        </Card>
                        <Card className="hidden sm:block">
                          <CardContent className="text-center">SM+</CardContent>
                        </Card>
                        <Card className="hidden md:block">
                          <CardContent className="text-center">MD+</CardContent>
                        </Card>
                        <Card className="hidden lg:block">
                          <CardContent className="text-center">LG+</CardContent>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Responsive Component Grid</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <Card key={i}>
                            <CardContent className="text-center">
                              Item {i}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </ComponentSection>
              </div>
            )}

            {/* Accessibility Section */}
            {selectedComponent === 'accessibility' && (
              <div>
                <ComponentSection title="Accessibility Testing">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-heading-sm mb-4">Color Contrast Testing</h3>
                      <div className="space-y-4">
                        {colorVariants.map((variant) => (
                          <div key={variant} className="flex items-center gap-4">
                            <Button variant={variant} className="w-32 capitalize">
                              {variant}
                            </Button>
                            <div className="text-sm text-gray-600">
                              Color contrast: {variant === 'warning' ? '⚠️ Check' : '✅ WCAG AA'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Focus Testing</h3>
                      <p className="text-gray-600 mb-4">Tab through these elements to test focus rings:</p>
                      <div className="space-y-4">
                        <Button>Focusable Button</Button>
                        <Input label="Focusable Input" placeholder="Tab to focus" />
                        <Select label="Focusable Select" options={selectOptions} placeholder="Tab to focus" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-heading-sm mb-4">Screen Reader Testing</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>All interactive elements have proper labels</li>
                        <li>Form fields include aria-labelledby and aria-describedby</li>
                        <li>Error states are announced with aria-invalid</li>
                        <li>Loading states include proper aria-labels</li>
                        <li>Modals include role="dialog" and aria-modal="true"</li>
                        <li>Focus is managed correctly in modals</li>
                      </ul>
                    </div>
                  </div>

                  <CodeExample code={`// All components include accessibility features:

// Proper ARIA attributes
<Input
  aria-labelledby="label-id"
  aria-describedby="helper-id error-id"
  aria-invalid={hasError}
  aria-required={isRequired}
/>

// Focus management
<Modal
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>

// Screen reader announcements
<Loading
  role="status"
  aria-label="Loading content"
/>`} />
                </ComponentSection>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Demo Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
        size="md"
      >
        <ModalBody>
          <p>This is an example modal demonstrating the Modal component functionality.</p>
          <p className="mt-4">Features include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Backdrop click to close</li>
            <li>Escape key to close</li>
            <li>Focus management</li>
            <li>Smooth animations</li>
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button style="outlined" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setModalOpen(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}