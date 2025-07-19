// Shared book-related types for OpenLibrary and app
export interface Author {
  name: string;
}
export interface Cover {
  medium: string;
  large?: string;
  small?: string;
}
export interface BookInfo {
  title: string;
  authors?: Author[];
  cover?: Cover;
}
