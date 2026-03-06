export const createParkingAlert = ({
  id,
  lat,
  lng,
  userId,
  price = 3,
  createdAt = Date.now(),
}) => ({
  id,
  lat,
  lng,
  userId,
  price,
  status: "active",
  createdAt,
});
