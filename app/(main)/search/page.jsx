// File: app/search/page.js
import SearchPage from "@/components/SearchPage";

export const metadata = {
  title: 'Search Products',
  description: 'Search our catalog for the perfect product.',
};

export default function SearchPageRoute() {
  return <SearchPage />;
}