type Props = {
  imageData: string;
};

export const MemeViewer = ({ imageData }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 p-4">
      <img
        src={imageData}
        alt="Meme"
        className="w-full max-w-lg rounded-lg shadow-lg"
      />
    </div>
  );
};
