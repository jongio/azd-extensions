import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      const { getByText } = render(<Card>Card Content</Card>)
      expect(getByText('Card Content')).toBeInTheDocument()
    })

    it('applies base classes', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('rounded-lg')
      expect(card.className).toContain('border')
    })
  })

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      const { getByText } = render(<CardHeader>Header</CardHeader>)
      expect(getByText('Header')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      const { container } = render(<CardTitle>Title</CardTitle>)
      const title = container.querySelector('h3')
      expect(title).toBeInTheDocument()
      expect(title?.textContent).toBe('Title')
    })
  })

  describe('CardDescription', () => {
    it('renders description text', () => {
      const { getByText } = render(<CardDescription>Description</CardDescription>)
      expect(getByText('Description')).toBeInTheDocument()
    })
  })

  describe('CardContent', () => {
    it('renders content', () => {
      const { getByText } = render(<CardContent>Content</CardContent>)
      expect(getByText('Content')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('renders footer', () => {
      const { getByText } = render(<CardFooter>Footer</CardFooter>)
      expect(getByText('Footer')).toBeInTheDocument()
    })
  })
})
