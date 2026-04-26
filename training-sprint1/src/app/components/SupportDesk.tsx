type Props = {
  phone: string;
  formUrl: string | null;
  isHighlighted?: boolean;
};

export function SupportDesk({ phone, formUrl, isHighlighted = false }: Props) {
  return (
    <div className={isHighlighted ? 'highlight p-4 border rounded' : 'p-4 border rounded'}>
      <p>{phone}</p>
      {formUrl !== null && (
        <a href={formUrl} className="text-blue-600 underline">
          フォームで問い合わせる
        </a>
      )}
    </div>
  );
}
