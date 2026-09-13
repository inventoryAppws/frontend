function UserAvatar({
  name,
  size = "medium",
}) {

  const getInitials = (value) => {

    if (!value) {
      return "?";
    }


    const words =
      value
        .trim()
        .split(/\s+/);


    if (words.length === 1) {

      return words[0]
        .charAt(0)
        .toUpperCase();

    }


    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();

  };


  return (
    <div
      className={`user-avatar user-avatar-${size}`}
    >
      {getInitials(name)}
    </div>
  );
}


export default UserAvatar;