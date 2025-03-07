'use client';

import { useState, useEffect } from 'react';
import { PulseLoader } from 'react-spinners';
import styles from './page.module.css';

interface Quote {
  content: string;
  author: string;
  id?: string;
}

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Quote[]>([]);

  const fetchNewQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.quotable.io/random', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 0 },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !data.content || !data.author) {
        throw new Error('Invalid data received from API');
      }
      
      setQuote({
        content: data.content,
        author: data.author
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote({
        content: 'Failed to fetch quote. Please try again.',
        author: 'System'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewQuote();
    // Load favorites from localStorage only on client side
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('favoriteQuotes');
      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites);
          setFavorites(parsed);
        } catch (e) {
          console.error('Error parsing favorites:', e);
          localStorage.removeItem('favoriteQuotes'); // Clear invalid data
        }
      }
    }
  }, []);

  // Add a client-side only state for loader
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveQuote = () => {
    if (!quote) return;
    
    const newFavorite = {
      ...quote,
      id: Date.now().toString() // Add unique ID for each saved quote
    };
    
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteQuotes', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = (id: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteQuotes', JSON.stringify(updatedFavorites));
  };

  const getTwitterShareUrl = () => {
    if (!quote) return '#';
    const text = encodeURIComponent(`"${quote.content}" - ${quote.author}`);
    return `https://twitter.com/intent/tweet?text=${text}`;
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Daily Inspiration</h1>
        <div className={styles.quoteCard}>
          <div className={styles.quoteIcon}>"</div>
          {loading ? (
            <div className={styles.loadingContainer}>
              {isClient && <PulseLoader color="#6366f1" size={10} />}
            </div>
          ) : (
            <div className={styles.fadeIn}>
              <p className={styles.quoteText}>{quote?.content}</p>
              <p className={styles.author}>- {quote?.author}</p>
            </div>
          )}
        </div>
        <div className={styles.buttonContainer}>
          <button 
            className={styles.newQuoteButton}
            onClick={fetchNewQuote}
            disabled={loading}
          >
            New Quote
          </button>
          <button 
            className={styles.saveButton}
            onClick={saveQuote}
            disabled={loading || !quote || favorites.some(fav => fav.content === quote.content)}
          >
            Save Quote
          </button>
          <a 
            href={getTwitterShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.twitterButton}
          >
            Share on Twitter
          </a>
        </div>

        {favorites.length > 0 && (
          <div className={styles.favoritesSection}>
            <h2 className={styles.favoritesTitle}>Favorite Quotes</h2>
            <div className={styles.favoritesList}>
              {favorites.map((fav) => (
                <div key={fav.id} className={styles.favoriteQuoteCard}>
                  <p className={styles.quoteText}>{fav.content}</p>
                  <p className={styles.author}>- {fav.author}</p>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeFromFavorites(fav.id!)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
