export function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-2xl mx-auto px-4 md:px-12 py-6">
        <div className="flex justify-between items-center text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Hayato Shimada</p>
          <div className="flex gap-4">
            <a
              href="https://github.com/HayatoShimada"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://note.com/85_store"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              note
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
