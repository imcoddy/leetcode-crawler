for f in `ls ./todo`
do
    sed -i '' -e's/[[:space:]]*$//' "./todo/$f"
done
