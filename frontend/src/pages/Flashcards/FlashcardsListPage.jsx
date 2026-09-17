import React, { useState, useEffect } from 'react';
import flashcardService from '../../services/flashcardService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const FlashcardsListPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      setLoading(true);
      try {
        const response = await flashcardService.getAllFlashcardSets(currentPage);

        setFlashcardSets(response.data);
        setPagination(response.pagination);
      } catch (error) {
        toast.error('Failed to fetch flashcard sets.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcardSets();
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (flashcardSets.length === 0) {
      return (
        <EmptyState
          title="No Flashcard Sets Found"
          description="You haven't generated any flashcards yet. Go to a document to creat you first set."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {flashcardSets.map((set) => (
          <FlashcardSetCard key={set._id} flashcardSet={set} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title={'All Flashcard Sets'}/>
      {renderContent()}

      {!loading && flashcardSets.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </div>
  )
}

export default FlashcardsListPage