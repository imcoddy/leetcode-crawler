for f in `ls ./problemset`
do
    sed -i '' -e's/[[:space:]]*$//' "./problemset/$f"
done
